import { NextResponse } from "next/server"

import { db } from "@/app/_lib/prisma"

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { ...corsHeaders, "Cache-Control": "no-store" } })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const barber = await db.barber.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        avatar: true,
        bio: true,
        cidade: true,
        jobTitle: true,
        especialidades: true,
        user: { select: { name: true, image: true } },
        barbershop: { select: { id: true, name: true } },
        portfolioPhotos: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, imageUrl: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
        },
      },
    })
    if (!barber) return json({ error: "Barbeiro não encontrado." }, 404)
    const ratings = barber.reviews.map(({ rating }) => rating)
    return json({
      data: {
        id: barber.id,
        name: barber.nome ?? barber.user.name ?? "Barbeiro",
        avatar: barber.avatar ?? barber.user.image,
        bio: barber.bio,
        city: barber.cidade,
        jobTitle: barber.jobTitle,
        specialties: barber.especialidades,
        barbershop: barber.barbershop,
        averageRating: ratings.length ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length : null,
        reviewCount: ratings.length,
        portfolio: barber.portfolioPhotos,
        reviews: barber.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          userName: review.user.name ?? "Cliente",
        })),
      },
    })
  } catch (error) {
    console.error("Falha ao carregar perfil público do barbeiro", error)
    return json({ error: "Não foi possível carregar o perfil do barbeiro." }, 500)
  }
}
