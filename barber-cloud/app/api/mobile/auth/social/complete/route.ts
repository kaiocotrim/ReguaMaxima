import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/app/_lib/prisma"
import { createMobileSocialCode } from "@/app/_lib/mobile-social-auth"

export const runtime = "nodejs"

function redirectToApp(parameters: Record<string, string>) {
  const redirectUrl = new URL("reguamaximaapp://auth/callback")

  for (const [key, value] of Object.entries(parameters)) {
    redirectUrl.searchParams.set(key, value)
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: redirectUrl.toString(),
    },
  })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return redirectToApp({ error: "social_session_missing" })
    }

    const user = await db.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
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

      if (!currentUser) return null
      if (currentUser.role) return currentUser

      const updatedUser = await tx.user.update({
        where: { id: currentUser.id },
        data: {
          role: "CLIENT",
          client: {
            upsert: {
              create: { nome: currentUser.name },
              update: { nome: currentUser.name },
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          password: true,
        },
      })

      return updatedUser
    })

    if (!user?.role) {
      return redirectToApp({ error: "profile_required" })
    }

    const code = await createMobileSocialCode(user.id)
    return redirectToApp({ code })
  } catch (error) {
    console.error("Falha ao concluir login social mobile", {
      name: error instanceof Error ? error.name : "UnknownError",
    })
    return redirectToApp({ error: "social_auth_unavailable" })
  }
}
