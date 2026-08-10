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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticated = await authenticateMobileAccess(request)
  if (!authenticated.ok) {
    return mobileAuthJson(
      { code: "UNAUTHORIZED", error: "Sua sessão expirou. Entre novamente." },
      401,
    )
  }

  const { id } = await params
  const booking = await db.booking.findFirst({
    where: {
      id,
      userId: authenticated.user.id,
      status: "EM_ANDAMENTO",
      date: { gt: new Date() },
    },
    select: { id: true, barbershopId: true },
  })

  if (!booking) {
    return mobileAuthJson(
      {
        code: "BOOKING_NOT_CANCELLABLE",
        error: "Este agendamento não foi encontrado ou não pode mais ser cancelado.",
      },
      404,
    )
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELADO", cancelledAt: new Date() },
      })
      await tx.auditLog.create({
        data: {
          barbershopId: booking.barbershopId,
          actorId: authenticated.user.id,
          action: "BOOKING_CANCELLED",
          entityType: "Booking",
          entityId: booking.id,
          details: { cancelledBy: authenticated.user.id, source: "mobile" },
        },
      })
    })

    return mobileAuthJson({
      data: { bookingId: booking.id, status: "CANCELADO" },
      message: "Agendamento cancelado e salvo no histórico.",
    })
  } catch (error) {
    console.error("Falha ao cancelar agendamento pelo aplicativo", error)
    return mobileAuthJson(
      { code: "CANCELLATION_FAILED", error: "Não foi possível cancelar o agendamento." },
      500,
    )
  }
}
