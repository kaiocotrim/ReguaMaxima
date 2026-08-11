import "server-only"

import { createHash, randomBytes } from "node:crypto"

import { db } from "@/app/_lib/prisma"

const MOBILE_SOCIAL_IDENTIFIER_PREFIX = "mobile-social:"
const MOBILE_SOCIAL_CODE_MAX_AGE_MS = 5 * 60 * 1000
const MOBILE_SOCIAL_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const mobileSocialProviders = ["google", "facebook", "github"] as const
export type MobileSocialProvider = (typeof mobileSocialProviders)[number]

export function isMobileSocialProvider(
  value: unknown,
): value is MobileSocialProvider {
  return mobileSocialProviders.some((provider) => provider === value)
}

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex")
}

export async function createMobileSocialCode(userId: string) {
  const code = randomBytes(32).toString("base64url")
  const identifier = `${MOBILE_SOCIAL_IDENTIFIER_PREFIX}${userId}`
  const now = new Date()

  await db.$transaction([
    db.verificationToken.deleteMany({
      where: {
        identifier,
        expires: { lte: now },
      },
    }),
    db.verificationToken.create({
      data: {
        identifier,
        token: hashCode(code),
        expires: new Date(now.getTime() + MOBILE_SOCIAL_CODE_MAX_AGE_MS),
      },
    }),
  ])

  return code
}

export async function consumeMobileSocialCode(code: unknown) {
  if (typeof code !== "string" || !MOBILE_SOCIAL_CODE_PATTERN.test(code)) {
    return null
  }

  const token = hashCode(code)
  const now = new Date()

  return db.$transaction(async (tx) => {
    const storedCode = await tx.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: MOBILE_SOCIAL_IDENTIFIER_PREFIX },
        expires: { gt: now },
      },
      select: { identifier: true },
    })

    if (!storedCode) return null

    const consumed = await tx.verificationToken.deleteMany({
      where: {
        identifier: storedCode.identifier,
        token,
        expires: { gt: now },
      },
    })

    if (consumed.count !== 1) return null

    const userId = storedCode.identifier.slice(
      MOBILE_SOCIAL_IDENTIFIER_PREFIX.length,
    )

    return tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        password: true,
      },
    })
  })
}
