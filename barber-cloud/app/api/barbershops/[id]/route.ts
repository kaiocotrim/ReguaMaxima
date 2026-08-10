import { NextResponse } from "next/server"

import { db } from "@/app/_lib/prisma"

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { ...corsHeaders, "Cache-Control": "no-store" },
  })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  try {
    const barbershop = await db.barbershop.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        cidade: true,
        phones: true,
        instagram: true,
        description: true,
        imageUrl: true,
        capaUrl: true,
        acceptsBookings: true,
        latitude: true,
        longitude: true,
        services: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true,
            duration: true,
          },
        },
        barbers: {
          where: { isActive: true },
          select: {
            id: true,
            nome: true,
            avatar: true,
            user: { select: { name: true, image: true } },
            reviews: { select: { rating: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
      },
    })

    if (!barbershop) {
      return json({ error: "Barbearia não encontrada." }, 404)
    }

    const reviewCount = barbershop.reviews.length
    const averageRating = reviewCount
      ? barbershop.reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviewCount
      : null

    return json({
      data: {
        ...barbershop,
        reviewCount,
        averageRating,
        services: barbershop.services.map((service) => ({
          ...service,
          price: Number(service.price),
        })),
        barbers: barbershop.barbers.map((barber) => {
          const ratings = barber.reviews.map(({ rating }) => rating)
          return {
            id: barber.id,
            name: barber.nome ?? barber.user.name ?? "Barbeiro",
            avatar: barber.avatar ?? barber.user.image,
            reviewCount: ratings.length,
            averageRating: ratings.length
              ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
              : null,
          }
        }),
        reviews: barbershop.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          userName: review.user.name ?? "Cliente",
        })),
      },
    })
  } catch (error) {
    console.error("Failed to load a barbershop for the mobile app:", error)
    return json({ error: "Não foi possível carregar a barbearia." }, 500)
  }
}
