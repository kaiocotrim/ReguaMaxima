"use server"

import { db } from "@/app/_lib/prisma"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth"
import { sendBookingEmail } from "./send-booking-email"

type BookingInput = {
  barbershopId: string
  serviceId: string
  barberId: string
  date: string
  time: string
  rescheduleBookingId?: string
}

type DayAvailabilityInput = Pick<BookingInput, "barbershopId" | "serviceId"> & {
  date: string
}

type BarberAvailabilityInput = DayAvailabilityInput & {
  barberId: string
}

type ReservedBooking = {
  id: string
  date: Date
  userEmail: string | null
  userName: string | null
  barbershopName: string
  serviceName: string
  barberName: string | null
}

type BookingWithDuration = {
  barberId: string
  date: Date
  durationMinutes: number | null
  service: { duration: number }
}

type BarberForAvailability = {
  id: string
  workSchedules: {
    weekday: number
    enabled: boolean
    startTime: string
    endTime: string
  }[]
  serviceConfigs: {
    customDuration: number | null
  }[]
}

const DEFAULT_OPENING_TIME = "08:00"
const DEFAULT_CLOSING_TIME = "19:00"
const SLOT_INTERVAL_MINUTES = 30
const BOOKING_TIME_ZONE = "America/Sao_Paulo"
const BOOKING_DISABLED_MESSAGE =
  "Esta barbearia está temporariamente fechada para novos agendamentos."

function availabilityErrorMessage(error: unknown) {
  return error instanceof Error && error.message === BOOKING_DISABLED_MESSAGE
    ? error.message
    : "Não foi possível consultar os horários agora."
}

function overlaps(
  requestedStart: Date,
  requestedEnd: Date,
  existingStart: Date,
  existingDuration: number,
) {
  const existingEnd = new Date(
    existingStart.getTime() + existingDuration * 60_000,
  )
  return requestedStart < existingEnd && requestedEnd > existingStart
}

function clockToMinutes(value: string | null, fallback: string) {
  const match = (value ?? fallback).match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return clockToMinutes(fallback, fallback)

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return clockToMinutes(fallback, fallback)

  return hours * 60 + minutes
}

function parseDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) throw new Error("Data inválida.")

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const testDate = new Date(Date.UTC(year, month - 1, day))

  if (
    testDate.getUTCFullYear() !== year ||
    testDate.getUTCMonth() !== month - 1 ||
    testDate.getUTCDate() !== day
  ) {
    throw new Error("Data inválida.")
  }

  return { year, month, day }
}

function timeZoneOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  )

  return (
    Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    ) - date.getTime()
  )
}

function bookingDateTime(dateKey: string, time: string) {
  const { year, month, day } = parseDateKey(dateKey)
  const timeMatch = time.match(/^(\d{2}):(\d{2})$/)
  if (!timeMatch) throw new Error("Horário inválido.")

  const hours = Number(timeMatch[1])
  const minutePart = Number(timeMatch[2])
  if (hours > 23 || minutePart > 59) {
    throw new Error("Horário inválido.")
  }

  const intendedUtc = Date.UTC(
    year,
    month - 1,
    day,
    hours,
    minutePart,
  )
  let result = new Date(intendedUtc)

  for (let attempt = 0; attempt < 2; attempt++) {
    result = new Date(intendedUtc - timeZoneOffsetMs(result))
  }

  return result
}

function nextDateKey(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey)
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1))
  return [
    nextDay.getUTCFullYear(),
    String(nextDay.getUTCMonth() + 1).padStart(2, "0"),
    String(nextDay.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function weekdayFromDateKey(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

function createAvailableSlots({
  dateKey,
  openingTime,
  closingTime,
  serviceDuration,
  bookings,
  barberId,
}: {
  dateKey: string
  openingTime: string | null
  closingTime: string | null
  serviceDuration: number
  bookings: BookingWithDuration[]
  barberId: string
}) {
  const openingMinutes = clockToMinutes(
    openingTime,
    DEFAULT_OPENING_TIME,
  )
  const closingMinutes = clockToMinutes(
    closingTime,
    DEFAULT_CLOSING_TIME,
  )
  const now = Date.now()
  const availableSlots: string[] = []

  for (
    let minutes = openingMinutes;
    minutes + serviceDuration <= closingMinutes;
    minutes += SLOT_INTERVAL_MINUTES
  ) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0")
    const mins = String(minutes % 60).padStart(2, "0")
    const slotTime = `${hours}:${mins}`
    const slotStart = bookingDateTime(dateKey, slotTime)
    const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60_000)

    if (slotStart.getTime() <= now) continue

    const hasConflict = bookings.some(
      (booking) =>
        booking.barberId === barberId &&
        overlaps(
          slotStart,
          slotEnd,
          booking.date,
          booking.durationMinutes ?? booking.service.duration,
        ),
    )

    if (!hasConflict) {
      availableSlots.push(slotTime)
    }
  }

  return availableSlots
}

async function getDayAvailability(
  tx: typeof db,
  data: DayAvailabilityInput,
) {
  parseDateKey(data.date)
  const dayStart = bookingDateTime(data.date, "00:00")
  const dayEnd = bookingDateTime(nextDateKey(data.date), "00:00")

  const [service, barbershop, barbers, longestService] = await Promise.all([
    tx.barbeshopService.findFirst({
      where: { id: data.serviceId, barbershopId: data.barbershopId },
      select: { duration: true },
    }),
    tx.barbershop.findUnique({
      where: { id: data.barbershopId },
      select: {
        horarioAbertura: true,
        horarioFechamento: true,
        acceptsBookings: true,
      },
    }),
    tx.barber.findMany({
      where: {
        barbershopId: data.barbershopId,
        isActive: true,
        OR: [
          { serviceConfigs: { none: { serviceId: data.serviceId } } },
          {
            serviceConfigs: {
              some: { serviceId: data.serviceId, enabled: true },
            },
          },
        ],
      },
      select: {
        id: true,
        workSchedules: {
          where: { weekday: weekdayFromDateKey(data.date) },
          select: {
            weekday: true,
            enabled: true,
            startTime: true,
            endTime: true,
          },
        },
        serviceConfigs: {
          where: { serviceId: data.serviceId, enabled: true },
          select: { customDuration: true },
        },
      },
    }),
    tx.barbeshopService.aggregate({
      where: { barbershopId: data.barbershopId },
      _max: { duration: true },
    }),
  ])

  if (!service || !barbershop) {
    throw new Error("Serviço ou barbearia não encontrado.")
  }

  if (!barbershop.acceptsBookings) {
    throw new Error(BOOKING_DISABLED_MESSAGE)
  }

  const searchStart = new Date(
    dayStart.getTime() -
      (longestService._max.duration ?? service.duration) * 60_000,
  )
  const bookings = await tx.booking.findMany({
    where: {
      barbershopId: data.barbershopId,
      status: { not: "CANCELADO" },
      date: { gte: searchStart, lt: dayEnd },
    },
    select: {
      barberId: true,
      date: true,
      durationMinutes: true,
      service: { select: { duration: true } },
    },
  })

  const timesByBarber = new Map(
    (barbers as BarberForAvailability[]).map((barber) => {
      const schedule = barber.workSchedules[0]
      const serviceDuration =
        barber.serviceConfigs[0]?.customDuration ?? service.duration
      const times =
        schedule && !schedule.enabled
          ? []
          : createAvailableSlots({
              dateKey: data.date,
              openingTime:
                schedule?.startTime ?? barbershop.horarioAbertura,
              closingTime:
                schedule?.endTime ?? barbershop.horarioFechamento,
              serviceDuration,
              bookings,
              barberId: barber.id,
            })

      return [barber.id, times] as const
    }),
  )

  return { timesByBarber }
}

async function unavailableBarbers(
  tx: typeof db,
  data: Pick<
    BookingInput,
    "barbershopId" | "serviceId" | "barberId" | "date" | "time"
  >,
) {
  const service = await tx.barbeshopService.findFirst({
    where: { id: data.serviceId, barbershopId: data.barbershopId },
    select: {
      duration: true,
      barberConfigs: {
        where: { barberId: data.barberId, enabled: true },
        select: { customDuration: true },
      },
    },
  })

  if (!service) {
    throw new Error("Serviço não encontrado nesta barbearia.")
  }

  const requestedStart = bookingDateTime(data.date, data.time)
  const requestedDuration =
    service.barberConfigs[0]?.customDuration ?? service.duration
  const requestedEnd = new Date(
    requestedStart.getTime() + requestedDuration * 60_000,
  )
  const longestService = await tx.barbeshopService.aggregate({
    where: { barbershopId: data.barbershopId },
    _max: { duration: true },
  })
  const searchStart = new Date(
    requestedStart.getTime() -
      (longestService._max.duration ?? service.duration) * 60_000,
  )

  const bookings = await tx.booking.findMany({
    where: {
      barbershopId: data.barbershopId,
      status: { not: "CANCELADO" },
      date: { gte: searchStart, lt: requestedEnd },
    },
    select: {
      barberId: true,
      date: true,
      durationMinutes: true,
      service: { select: { duration: true } },
    },
  })

  return [
    ...new Set(
      bookings
        .filter((booking) =>
          overlaps(
            requestedStart,
            requestedEnd,
            booking.date,
            booking.durationMinutes ?? booking.service.duration,
          ),
        )
        .map((booking) => booking.barberId),
    ),
  ]
}

export async function getAvailableBarberIdsForDate(
  data: DayAvailabilityInput,
) {
  try {
    const { timesByBarber } = await getDayAvailability(db, data)
    const barberIds = [...timesByBarber.entries()]
      .filter(([, times]) => times.length > 0)
      .map(([barberId]) => barberId)
    const firstTimes = Object.fromEntries(
      [...timesByBarber.entries()]
        .filter(([, times]) => times.length > 0)
        .map(([barberId, times]) => [barberId, times[0]]),
    )

    return { success: true as const, barberIds, firstTimes }
  } catch (error) {
    console.error("Erro ao consultar barbeiros disponíveis:", error)
    return {
      success: false as const,
      barberIds: [] as string[],
      firstTimes: {} as Record<string, string>,
      error: availabilityErrorMessage(error),
    }
  }
}

export async function getAvailableTimesForBarber(
  data: BarberAvailabilityInput,
) {
  try {
    const { timesByBarber } = await getDayAvailability(db, data)
    if (!timesByBarber.has(data.barberId)) {
      return {
        success: false as const,
        times: [] as string[],
        error: "Barbeiro não pertence a esta barbearia.",
      }
    }

    return {
      success: true as const,
      times: timesByBarber.get(data.barberId) ?? [],
    }
  } catch (error) {
    console.error("Erro ao consultar horários disponíveis:", error)
    return {
      success: false as const,
      times: [] as string[],
      error: availabilityErrorMessage(error),
    }
  }
}

export async function createBookingForUser(
  userId: string,
  data: BookingInput,
) {
  let requestedDate: Date

  try {
    requestedDate = bookingDateTime(data.date, data.time)
  } catch {
    return {
      success: false as const,
      error: "Escolha uma data e um horário válidos.",
    }
  }

  if (
    requestedDate.getTime() <= Date.now()
  ) {
    return {
      success: false as const,
      error: "Escolha uma data e um horário futuros.",
    }
  }

  try {
    let booking: ReservedBooking | undefined

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        booking = await db.$transaction(
          async (tx) => {
            const barber = await tx.barber.findFirst({
              where: {
                id: data.barberId,
                barbershopId: data.barbershopId,
                isActive: true,
                OR: [
                  { serviceConfigs: { none: { serviceId: data.serviceId } } },
                  {
                    serviceConfigs: {
                      some: { serviceId: data.serviceId, enabled: true },
                    },
                  },
                ],
              },
              select: {
                id: true,
                serviceConfigs: {
                  where: { serviceId: data.serviceId, enabled: true },
                  select: {
                    customPrice: true,
                    customDuration: true,
                  },
                },
              },
            })
            if (!barber) {
              throw new Error("Barbeiro não pertence a esta barbearia.")
            }

            const selectedService = await tx.barbeshopService.findFirst({
              where: {
                id: data.serviceId,
                barbershopId: data.barbershopId,
              },
              select: { price: true, duration: true },
            })
            if (!selectedService) {
              throw new Error("Serviço não encontrado nesta barbearia.")
            }

            const { timesByBarber } = await getDayAvailability(
              tx as unknown as typeof db,
              {
                barbershopId: data.barbershopId,
                serviceId: data.serviceId,
                date: data.date,
              },
            )

            if (
              !timesByBarber.get(data.barberId)?.includes(data.time)
            ) {
              throw new Error(
                "Este horário não está mais disponível. Escolha outro horário.",
              )
            }

            const unavailableBarberIds = await unavailableBarbers(
              tx as unknown as typeof db,
              {
                barbershopId: data.barbershopId,
                serviceId: data.serviceId,
                barberId: data.barberId,
                date: data.date,
                time: data.time,
              },
            )
            if (unavailableBarberIds.includes(data.barberId)) {
              throw new Error(
                "Este horário acabou de ser ocupado. Escolha outro horário disponível.",
              )
            }

            const created = await tx.booking.create({
              data: {
                date: requestedDate,
                agreedPrice:
                  barber.serviceConfigs[0]?.customPrice ??
                  selectedService.price,
                durationMinutes:
                  barber.serviceConfigs[0]?.customDuration ??
                  selectedService.duration,
                user: { connect: { id: userId } },
                barbershop: { connect: { id: data.barbershopId } },
                service: { connect: { id: data.serviceId } },
                barber: { connect: { id: data.barberId } },
              },
              select: {
                id: true,
                date: true,
                user: { select: { email: true, name: true } },
                barbershop: { select: { name: true } },
                service: { select: { name: true } },
                barber: {
                  select: {
                    user: { select: { name: true } },
                  },
                },
              },
            })

            if (data.rescheduleBookingId) {
              const previous = await tx.booking.updateMany({
                where: {
                  id: data.rescheduleBookingId,
                  userId,
                  status: "EM_ANDAMENTO",
                  date: { gt: new Date() },
                },
                data: {
                  status: "CANCELADO",
                  cancelledAt: new Date(),
                },
              })
              if (previous.count !== 1) {
                throw new Error(
                  "O agendamento original não está mais disponível para reagendamento.",
                )
              }

              await tx.auditLog.create({
                data: {
                  barbershopId: data.barbershopId,
                  actorId: userId,
                  action: "BOOKING_RESCHEDULED",
                  entityType: "Booking",
                  entityId: created.id,
                  details: {
                    previousBookingId: data.rescheduleBookingId,
                  },
                },
              })
            }

            return {
              id: created.id,
              date: created.date,
              userEmail: created.user.email,
              userName: created.user.name,
              barbershopName: created.barbershop.name,
              serviceName: created.service.name,
              barberName: created.barber.user.name,
            }
          },
          { isolationLevel: "Serializable" },
        )
        break
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code === "P2034" && attempt === 0) continue
        throw error
      }
    }

    if (!booking) {
      return {
        success: false as const,
        error: "O horário acabou de ser ocupado. Escolha outro horário.",
      }
    }

    try {
      if (booking.userEmail) {
        await sendBookingEmail({
          toEmail: booking.userEmail,
          userName: booking.userName ?? "Cliente",
          barbershopName: booking.barbershopName,
          serviceName: booking.serviceName,
          barberName: booking.barberName ?? "Barbeiro",
          date: booking.date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          time: booking.date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })
      }
    } catch (emailError) {
      console.error("Agendamento salvo, mas o e-mail falhou:", emailError)
    }

    return { success: true as const, bookingId: booking.id }
  } catch (error) {
    console.error("Erro ao criar agendamento:", error)
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o agendamento.",
    }
  }
}

export async function createBooking(data: BookingInput) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false as const, error: "Faça login para agendar." }
  }

  return createBookingForUser(session.user.id, data)
}
