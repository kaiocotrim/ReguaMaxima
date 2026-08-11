import { isMobileSocialProvider } from "@/app/_lib/mobile-social-auth"
import { MobileSocialSignIn } from "./MobileSocialSignIn"

export default async function MobileAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  const { provider } = await searchParams

  if (!isMobileSocialProvider(provider)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-6 text-center text-[#173f40]">
        <div>
          <h1 className="text-xl font-semibold">Provider inválido</h1>
          <p className="mt-2 text-sm text-[#68736f]">
            Volte ao aplicativo e tente novamente.
          </p>
        </div>
      </main>
    )
  }

  return <MobileSocialSignIn provider={provider} />
}
