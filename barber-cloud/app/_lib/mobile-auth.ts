import "server-only"

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import { decode, encode, type JWT } from "next-auth/jwt"
import { NextResponse } from "next/server"

import { createPasswordVersion } from "@/app/_lib/auth-security"
import { db } from "@/app/_lib/prisma"
import type { PasswordAuthenticatedUser } from "@/app/_lib/credentials-auth"

const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MOBILE_SESSION_PREFIX = "mobile:"
const MOBILE_ACCESS_SALT = "regua-maxima-mobile-access"
const MOBILE_ACCESS_TYPE = "mobile-access"
const MOBILE_ACCESS_AUDIENCE = "regua-maxima-mobile"
const MOBILE_ACCESS_ISSUER = "regua-maxima-api"
const MOBILE_REFRESH_TYPE = "mobile-refresh"
const MOBILE_REFRESH_VERSION = 1
const MAX_ACTIVE_MOBILE_SESSIONS = 8

const mobileAuthCorsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
}

export type MobileAuthUser = {
  id: string
  name: string
  email: string
  image: string | null
  role: "CLIENT" | "BARBER"
}

type MobileSessionUser = Omit<PasswordAuthenticatedUser, "password"> & {
  password: string | null
  role: "CLIENT" | "BARBER"
}

type MobileSessionCandidate = Omit<PasswordAuthenticatedUser, "password"> & {
  password: string | null
}

export type MobileAuthTokenData = {
  user: MobileAuthUser
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}

type RefreshTokenPayload = {
  typ: typeof MOBILE_REFRESH_TYPE
  version: typeof MOBILE_REFRESH_VERSION
  sid: string
  passwordVersion: string
}

type MobileAuthFailure =
  | { ok: false; reason: "INVALID_SESSION" }
  | { ok: false; reason: "PROFILE_REQUIRED" }

export type MobileAuthResult =
  | { ok: true; data: MobileAuthTokenData }
  | MobileAuthFailure

export type MobileAccessResult =
  | { ok: true; user: MobileAuthUser; sessionId: string }
  | MobileAuthFailure

function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET nao configurada")
  }

  return secret
}

function valuesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

function hashRefreshToken(refreshToken: string) {
  return `${MOBILE_SESSION_PREFIX}${createHash("sha256")
    .update(refreshToken)
    .digest("hex")}`
}

function toMobileUser(user: MobileSessionUser): MobileAuthUser {
  return {
    id: user.id,
    name: user.name?.trim() || user.email || "Usuário",
    email: user.email ?? "",
    image: user.image,
    role: user.role,
  }
}

function createRefreshToken(sessionId: string, passwordVersion: string) {
  const payload: RefreshTokenPayload = {
    typ: MOBILE_REFRESH_TYPE,
    version: MOBILE_REFRESH_VERSION,
    sid: sessionId,
    passwordVersion,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  )
  const secretPart = randomBytes(32).toString("base64url")

  return `${encodedPayload}.${secretPart}`
}

function parseRefreshToken(value: unknown): RefreshTokenPayload | null {
  if (typeof value !== "string" || value.length < 80 || value.length > 1024) {
    return null
  }

  const parts = value.split(".")
  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1] ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    ) as Partial<RefreshTokenPayload>

    if (
      payload.typ !== MOBILE_REFRESH_TYPE ||
      payload.version !== MOBILE_REFRESH_VERSION ||
      typeof payload.sid !== "string" ||
      payload.sid.length < 16 ||
      payload.sid.length > 128 ||
      typeof payload.passwordVersion !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload.passwordVersion)
    ) {
      return null
    }

    return payload as RefreshTokenPayload
  } catch {
    return null
  }
}

async function createAccessToken(
  user: MobileSessionUser,
  sessionId: string,
  passwordVersion: string,
) {
  const issuedAt = Date.now()
  const expiresAt = new Date(issuedAt + ACCESS_TOKEN_MAX_AGE_SECONDS * 1000)
  const accessToken = await encode({
    secret: getAuthSecret(),
    salt: MOBILE_ACCESS_SALT,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
    token: {
      typ: MOBILE_ACCESS_TYPE,
      aud: MOBILE_ACCESS_AUDIENCE,
      iss: MOBILE_ACCESS_ISSUER,
      sid: sessionId,
      sub: user.id,
      role: user.role,
      passwordVersion,
    },
  })

  return {
    accessToken,
    accessTokenExpiresAt: expiresAt.toISOString(),
  }
}

function isMobileRole(
  user: MobileSessionCandidate,
): user is MobileSessionUser {
  return user.role === "CLIENT" || user.role === "BARBER"
}

export function mobileAuthJson(
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...mobileAuthCorsHeaders,
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  })
}

export function mobileAuthOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...mobileAuthCorsHeaders,
      "Cache-Control": "no-store",
    },
  })
}

export function mobileAuthEmptyResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...mobileAuthCorsHeaders,
      "Cache-Control": "no-store",
    },
  })
}

export async function issueMobileSession(
  user: MobileSessionCandidate,
): Promise<MobileAuthResult> {
  if (!isMobileRole(user)) {
    return { ok: false, reason: "PROFILE_REQUIRED" }
  }

  const now = new Date()
  const sessionId = randomUUID()
  const passwordVersion = createPasswordVersion(user.password)
  const refreshToken = createRefreshToken(sessionId, passwordVersion)
  const refreshTokenExpiresAt = new Date(
    now.getTime() + REFRESH_TOKEN_MAX_AGE_MS,
  )
  const access = await createAccessToken(user, sessionId, passwordVersion)

  await db.$transaction(async (tx) => {
    await tx.session.deleteMany({
      where: {
        userId: user.id,
        sessionToken: { startsWith: MOBILE_SESSION_PREFIX },
        expires: { lte: now },
      },
    })

    const activeSessions = await tx.session.findMany({
      where: {
        userId: user.id,
        sessionToken: { startsWith: MOBILE_SESSION_PREFIX },
        expires: { gt: now },
      },
      orderBy: { expires: "asc" },
      select: { id: true },
    })
    const sessionsToRemove = activeSessions.slice(
      0,
      Math.max(0, activeSessions.length - MAX_ACTIVE_MOBILE_SESSIONS + 1),
    )

    if (sessionsToRemove.length > 0) {
      await tx.session.deleteMany({
        where: { id: { in: sessionsToRemove.map((session) => session.id) } },
      })
    }

    await tx.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        sessionToken: hashRefreshToken(refreshToken),
        expires: refreshTokenExpiresAt,
      },
    })
  })

  return {
    ok: true,
    data: {
      user: toMobileUser(user),
      ...access,
      refreshToken,
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
    },
  }
}

export async function rotateMobileRefreshToken(
  refreshToken: unknown,
): Promise<MobileAuthResult> {
  const parsedToken = parseRefreshToken(refreshToken)

  if (!parsedToken || typeof refreshToken !== "string") {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  const now = new Date()
  const expectedTokenHash = hashRefreshToken(refreshToken)
  const storedSession = await db.session.findUnique({
    where: { id: parsedToken.sid },
    select: {
      id: true,
      userId: true,
      sessionToken: true,
      expires: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          password: true,
        },
      },
    },
  })

  if (
    !storedSession ||
    !storedSession.sessionToken.startsWith(MOBILE_SESSION_PREFIX) ||
    !valuesMatch(storedSession.sessionToken, expectedTokenHash)
  ) {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  if (storedSession.expires <= now) {
    await db.session.deleteMany({
      where: { id: storedSession.id, sessionToken: expectedTokenHash },
    })
    return { ok: false, reason: "INVALID_SESSION" }
  }

  const user = storedSession.user

  if (!isMobileRole(user)) {
    await db.session.deleteMany({
      where: { id: storedSession.id, sessionToken: expectedTokenHash },
    })
    return { ok: false, reason: "PROFILE_REQUIRED" }
  }

  const mobileUser = user
  const currentPasswordVersion = createPasswordVersion(mobileUser.password)

  if (!valuesMatch(parsedToken.passwordVersion, currentPasswordVersion)) {
    await db.session.deleteMany({
      where: { id: storedSession.id, sessionToken: expectedTokenHash },
    })
    return { ok: false, reason: "INVALID_SESSION" }
  }

  const nextRefreshToken = createRefreshToken(
    storedSession.id,
    currentPasswordVersion,
  )
  const nextRefreshTokenExpiresAt = new Date(
    now.getTime() + REFRESH_TOKEN_MAX_AGE_MS,
  )
  const access = await createAccessToken(
    mobileUser,
    storedSession.id,
    currentPasswordVersion,
  )
  const rotated = await db.session.updateMany({
    where: {
      id: storedSession.id,
      userId: storedSession.userId,
      sessionToken: expectedTokenHash,
      expires: { gt: now },
    },
    data: {
      sessionToken: hashRefreshToken(nextRefreshToken),
      expires: nextRefreshTokenExpiresAt,
    },
  })

  if (rotated.count !== 1) {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  return {
    ok: true,
    data: {
      user: toMobileUser(mobileUser),
      ...access,
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt: nextRefreshTokenExpiresAt.toISOString(),
    },
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")

  if (!authorization) return null

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization)
  return match?.[1] ?? null
}

function hasValidMobileAccessClaims(token: JWT | null): token is JWT & {
  typ: typeof MOBILE_ACCESS_TYPE
  aud: typeof MOBILE_ACCESS_AUDIENCE
  iss: typeof MOBILE_ACCESS_ISSUER
  sid: string
  sub: string
  passwordVersion: string
  role: "CLIENT" | "BARBER"
} {
  return Boolean(
    token &&
    token.typ === MOBILE_ACCESS_TYPE &&
    token.aud === MOBILE_ACCESS_AUDIENCE &&
    token.iss === MOBILE_ACCESS_ISSUER &&
    typeof token.sid === "string" &&
    token.sid.length >= 16 &&
    typeof token.sub === "string" &&
    typeof token.passwordVersion === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(token.passwordVersion) &&
    (token.role === "CLIENT" || token.role === "BARBER"),
  )
}

export async function authenticateMobileAccess(
  request: Request,
): Promise<MobileAccessResult> {
  const accessToken = getBearerToken(request)

  if (!accessToken) {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  let token: JWT | null = null

  try {
    token = await decode({
      token: accessToken,
      secret: getAuthSecret(),
      salt: MOBILE_ACCESS_SALT,
    })
  } catch {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  if (!hasValidMobileAccessClaims(token)) {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  const now = new Date()
  const storedSession = await db.session.findUnique({
    where: { id: token.sid },
    select: {
      id: true,
      userId: true,
      sessionToken: true,
      expires: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          password: true,
        },
      },
    },
  })

  if (
    !storedSession ||
    storedSession.userId !== token.sub ||
    !storedSession.sessionToken.startsWith(MOBILE_SESSION_PREFIX)
  ) {
    return { ok: false, reason: "INVALID_SESSION" }
  }

  if (storedSession.expires <= now) {
    await db.session.deleteMany({ where: { id: storedSession.id } })
    return { ok: false, reason: "INVALID_SESSION" }
  }

  const user = storedSession.user

  if (!isMobileRole(user)) {
    await db.session.deleteMany({ where: { id: storedSession.id } })
    return { ok: false, reason: "PROFILE_REQUIRED" }
  }

  const mobileUser = user
  const currentPasswordVersion = createPasswordVersion(mobileUser.password)

  if (
    !valuesMatch(token.passwordVersion, currentPasswordVersion) ||
    token.role !== mobileUser.role
  ) {
    await db.session.deleteMany({ where: { id: storedSession.id } })
    return { ok: false, reason: "INVALID_SESSION" }
  }

  return {
    ok: true,
    user: toMobileUser(mobileUser),
    sessionId: storedSession.id,
  }
}

export async function revokeMobileRefreshToken(refreshToken: unknown) {
  const parsedToken = parseRefreshToken(refreshToken)

  if (!parsedToken || typeof refreshToken !== "string") return

  await db.session.deleteMany({
    where: {
      id: parsedToken.sid,
      sessionToken: hashRefreshToken(refreshToken),
    },
  })
}

export async function revokeMobileAccessSession(request: Request) {
  const authenticated = await authenticateMobileAccess(request)

  if (!authenticated.ok) return

  await db.session.deleteMany({
    where: {
      id: authenticated.sessionId,
      userId: authenticated.user.id,
      sessionToken: { startsWith: MOBILE_SESSION_PREFIX },
    },
  })
}
