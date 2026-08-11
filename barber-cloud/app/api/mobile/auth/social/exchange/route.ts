import {
  issueMobileSession,
  mobileAuthJson,
  mobileAuthOptionsResponse,
} from "@/app/_lib/mobile-auth"
import { consumeMobileSocialCode } from "@/app/_lib/mobile-social-auth"
import { consumeRateLimit, getClientIp } from "@/app/_lib/server-rate-limit"

export const runtime = "nodejs"

export function OPTIONS() {
  return mobileAuthOptionsResponse()
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    namespace: "mobile-social-exchange-ip",
    identifier: getClientIp(request.headers),
    limit: 15,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return mobileAuthJson(
      {
        code: "RATE_LIMITED",
        error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    )
  }

  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return mobileAuthJson(
      { code: "INVALID_CODE", error: "Código de acesso inválido." },
      400,
    )
  }

  try {
    const user = await consumeMobileSocialCode(body.code)

    if (!user) {
      return mobileAuthJson(
        {
          code: "INVALID_CODE",
          error: "Este acesso expirou. Tente entrar novamente.",
        },
        401,
      )
    }

    const mobileSession = await issueMobileSession(user)

    if (!mobileSession.ok) {
      return mobileAuthJson(
        {
          code: "PROFILE_REQUIRED",
          error: "Conclua seu perfil antes de entrar no aplicativo.",
        },
        403,
      )
    }

    return mobileAuthJson({ data: mobileSession.data })
  } catch (error) {
    console.error("Falha ao trocar código do login social mobile", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return mobileAuthJson(
      {
        code: "AUTH_UNAVAILABLE",
        error: "Não foi possível entrar. Tente novamente.",
      },
      500,
    )
  }
}
