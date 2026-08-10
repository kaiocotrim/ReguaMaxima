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
    return mobileAuthJson(
      { code: "UNAUTHORIZED", error: "Sua sessão expirou. Entre novamente." },
      401,
    )
  }

  try {
    const [favorites, favoriteBarbers] = await Promise.all([
      db.favoriteBarbershop.findMany({
        where: { userId: authenticated.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          barbershop: {
            select: {
              id: true,
              name: true,
              address: true,
              cidade: true,
              imageUrl: true,
              capaUrl: true,
              acceptsBookings: true,
              reviews: { select: { rating: true } },
            },
          },
        },
      }),
      db.favoriteBarber.findMany({
        where: { userId: authenticated.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          barber: {
            select: {
              id: true,
              nome: true,
              avatar: true,
              jobTitle: true,
              barbershop: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ])

    return mobileAuthJson({
      data: {
        barbershops: favorites.map(({ barbershop }) => {
          const ratings = barbershop.reviews.map(({ rating }) => rating)
          return {
            ...barbershop,
            reviews: undefined,
            reviewCount: ratings.length,
            averageRating: ratings.length
              ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
              : null,
          }
        }),
        barbers: favoriteBarbers.map(({ barber }) => barber),
      },
    })
  } catch (error) {
    console.error("Falha ao carregar favoritos do aplicativo", error)
    return mobileAuthJson(
      { code: "FAVORITES_UNAVAILABLE", error: "Não foi possível carregar seus favoritos." },
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

  let body: { barbershopId?: unknown }
  try {
    body = (await request.json()) as { barbershopId?: unknown }
  } catch {
    return mobileAuthJson({ code: "INVALID_REQUEST", error: "Dados inválidos." }, 400)
  }

  const barbershopId =
    typeof body.barbershopId === "string" ? body.barbershopId.trim() : ""
  if (!barbershopId || barbershopId.length > 80) {
    return mobileAuthJson(
      { code: "INVALID_REQUEST", error: "Barbearia inválida." },
      400,
    )
  }

  const barbershop = await db.barbershop.findUnique({
    where: { id: barbershopId },
    select: { id: true },
  })
  if (!barbershop) {
    return mobileAuthJson(
      { code: "BARBERSHOP_NOT_FOUND", error: "Barbearia não encontrada." },
      404,
    )
  }

  const key = { userId: authenticated.user.id, barbershopId }
  const existing = await db.favoriteBarbershop.findUnique({
    where: { userId_barbershopId: key },
    select: { id: true },
  })

  if (existing) {
    await db.favoriteBarbershop.delete({ where: { userId_barbershopId: key } })
    return mobileAuthJson({ data: { favorited: false } })
  }

  await db.favoriteBarbershop.create({ data: key })
  return mobileAuthJson({ data: { favorited: true } }, 201)
}
