"use client"

import { signIn } from "next-auth/react"
import { useEffect, useRef } from "react"

import type { MobileSocialProvider } from "@/app/_lib/mobile-social-auth"

const providerNames: Record<MobileSocialProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  github: "GitHub",
}

export function MobileSocialSignIn({
  provider,
}: {
  provider: MobileSocialProvider
}) {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    void signIn(provider, {
      callbackUrl: `${window.location.origin}/api/mobile/auth/social/complete`,
    }).catch(() => {
      window.location.href =
        "reguamaximaapp://auth/callback?error=oauth_start_failed"
    })
  }, [provider])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-6 text-[#173f40]">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#dfe5dc] border-t-[#c3f32c]" />
        <h1 className="mt-6 text-xl font-semibold">
          Abrindo {providerNames[provider]}
        </h1>
        <p className="mt-2 text-sm text-[#68736f]">
          Conclua o acesso com segurança para voltar ao aplicativo.
        </p>
      </div>
    </main>
  )
}
