import {
  authenticateMobileAccess,
  mobileAuthJson,
  mobileAuthOptionsResponse,
} from "@/app/_lib/mobile-auth"
import { createBookingForUser } from "@/app/_lib/create-booking"
import { db } from "@/app/_lib/prisma"

export const runtime = "nodejs"

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function OPTIONS() {
  return mobileAuthOptionsResponse()
}

export async function GET(request: Request) {
  const authenticated = await authenticateMobileAccess(request)

  if (!authenticated.ok) {
    return mobileAuthJson(
      { code: "UNAUTHORIZED", error: "Sua sessão expirou. Entre novamente." },
      401,
    )
  }

  try {
    const bookings = await db.booking.findMany({
      where: {
        userId: authenticated.user.id,
        status: "EM_ANDAMENTO",
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      take: 10,
      select: {
        id: true,
        date: true,
        status: true,
        service: { select: { name: true } },
        barbershop: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return mobileAuthJson({
      data: bookings.map((booking) => ({
        ...booking,
        date: booking.date.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Falha ao carregar agendamentos do aplicativo", error)
    return mobileAuthJson(
      { code: "BOOKINGS_UNAVAILABLE", error: "Não foi possível carregar seus agendamentos." },
      500,
    )
  }
}

export async function POST(request: Request) {
  const authenticated = await authenticateMobileAccess(request)

  if (!authenticated.ok) {
    return mobileAuthJson(
      { code: "UNAUTHORIZED", error: "Sua sessão expirou. Entre novamente." },
      401,
    )
  }

  if (authenticated.user.role !== "CLIENT") {
    return mobileAuthJson(
      { code: "FORBIDDEN", error: "Somente clientes podem realizar agendamentos." },
      403,
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return mobileAuthJson(
      { code: "INVALID_REQUEST", error: "Dados de agendamento inválidos." },
      400,
    )
  }

  const input = {
    barbershopId: text(body.barbershopId),
    serviceId: text(body.serviceId),
    barberId: text(body.barberId),
    date: text(body.date),
    time: text(body.time),
  }

  if (
    !input.barbershopId ||
    !input.serviceId ||
    !input.barberId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^\d{2}:\d{2}$/.test(input.time) ||
    Object.values(input).some((value) => value.length > 80)
  ) {
    return mobileAuthJson(
      { code: "INVALID_REQUEST", error: "Escolha data, barbeiro e horário válidos." },
      400,
    )
  }

  const result = await createBookingForUser(authenticated.user.id, input)

  return result.success
    ? mobileAuthJson({ data: { bookingId: result.bookingId } }, 201)
    : mobileAuthJson({ code: "BOOKING_FAILED", error: result.error }, 409)
}
