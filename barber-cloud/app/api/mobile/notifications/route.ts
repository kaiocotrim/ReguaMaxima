import {
  authenticateMobileAccess,
  mobileAuthJson,
  mobileAuthOptionsResponse,
} from "@/app/_lib/mobile-auth"
import { db } from "@/app/_lib/prisma"

export const runtime = "nodejs"

export function OPTIONS() {
  return mobileAuthOptionsResponse()
}

export async function GET(request: Request) {
  const authenticated = await authenticateMobileAccess(request)
  if (!authenticated.ok) {
    return mobileAuthJson({ code: "UNAUTHORIZED", error: "Sua sessão expirou. Entre novamente." }, 401)
  }

  try {
    const notifications = await db.userNotification.findMany({
      where: { userId: authenticated.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        bookingId: true,
        readAt: true,
        createdAt: true,
      },
    })

    return mobileAuthJson({
      data: notifications.map((notification) => ({
        ...notification,
        readAt: notification.readAt?.toISOString() ?? null,
        createdAt: notification.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Falha ao carregar notificações do aplicativo", error)
    return mobileAuthJson(
      { code: "NOTIFICATIONS_UNAVAILABLE", error: "Não foi possível carregar suas notificações." },
      500,
    )
  }
}

export async function PATCH(request: Request) {
  const authenticated = await authenticateMobileAccess(request)
  if (!authenticated.ok) {
    return mobileAuthJson({ code: "UNAUTHORIZED", error: "Sua sessão expirou. Entre novamente." }, 401)
  }

  let notificationId: string | null = null
  try {
    const body = (await request.json()) as { notificationId?: unknown }
    notificationId = typeof body.notificationId === "string" ? body.notificationId.trim() : null
  } catch {
    return mobileAuthJson({ code: "INVALID_REQUEST", error: "Dados inválidos." }, 400)
  }

  const result = await db.userNotification.updateMany({
    where: {
      userId: authenticated.user.id,
      readAt: null,
      ...(notificationId ? { id: notificationId } : {}),
    },
    data: { readAt: new Date() },
  })

  return mobileAuthJson({ data: { updated: result.count } })
}
