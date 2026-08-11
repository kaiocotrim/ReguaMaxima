"use client"

import { DashRing } from "@/app/_components/dash-ring"
import Image from "next/image"
import { Button } from "@/app/_components/ui/button"
import Header from "./header"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Avatar, AvatarImage } from "./ui/avatar"
import BarbershopItem from "./barbershop-item"
import SearchBar from "./SearchBar"
import { CalendarDays, ChevronRight, Heart, MapPin, Star } from "lucide-react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  PendingBookingReviews,
  type PendingReview,
} from "./PendingBookingReviews"

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/app/_components/ui/carousel"
import { BackgroundEffects } from "./BackgroundEffects"

const homeBanners = [
  {
    light: "/banner1.png",
    dark: "/banner2Dark.png.png",
    alt: "Agende com facilidade na Régua Máxima",
  },
  {
    light: "/banner2.png",
    dark: "/banner3Dark.png.png",
    alt: "Organize os horários da sua barbearia",
  },
  {
    light: "/banner3.png",
    dark: "/banner1Dark.png",
    alt: "Encontre uma barbearia ideal",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: "easeOut" as const },
  }),
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
}

type BookingCard = {
  id: string
  date: string
  service: {
    name: string
  }
  barbershop: {
    id: string
    name: string
    imageUrl: string
  }
}

type BarbershopCard = {
  id: string
  name: string
  address: string
  imageUrl: string
  reviews: { rating: number }[]
}

interface HomeClientProps {
  barbershops: BarbershopCard[]
  popularBarbershops: BarbershopCard[]
  favoriteBarbershops: BarbershopCard[]
  confirmedBookings: BookingCard[]
  pendingReviews: PendingReview[]
  loading?: boolean
}

export default function HomeClient({
  barbershops,
  popularBarbershops,
  favoriteBarbershops,
  confirmedBookings,
  pendingReviews,
  loading,
}: HomeClientProps) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const router = useRouter()

  const [bannerApi, setBannerApi] = useState<CarouselApi>()
  const [activeBanner, setActiveBanner] = useState(0)

  useEffect(() => {
    if (!bannerApi) return

    const updateActiveBanner = () => {
      setActiveBanner(bannerApi.selectedScrollSnap())
    }

    updateActiveBanner()
    bannerApi.on("select", updateActiveBanner)

    const autoplay = window.setInterval(() => {
      bannerApi.scrollNext()
    }, 5000)

    return () => {
      window.clearInterval(autoplay)
      bannerApi.off("select", updateActiveBanner)
    }
  }, [bannerApi])

  const bookingsToShow =
    confirmedBookings.length > 1
      ? [...confirmedBookings.slice(1), confirmedBookings[0]]
      : confirmedBookings

  const nextBooking = confirmedBookings[0]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <DashRing className="size-14" />
      </div>
    )
  }

  return (
    <div className="bg-background relative min-h-screen overflow-x-clip">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:max-w-6xl lg:px-6 lg:pt-14 lg:pb-8">
        {/* Saudação */}
        <motion.div
          className="space-y-1 lg:space-y-2"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <h2 className="text-xl font-bold sm:text-2xl lg:text-3xl">
            Olá,{" "}
            <span className="shine-text">
              {session?.user?.name
                ? role === "BARBER"
                  ? `${session.user.name} vamos trabalhar hoje?`
                  : `${session.user.name} corte novo hoje?`
                : "iremos alinhar o cabelo?"}
            </span>
          </h2>

          <p className="text-muted-foreground text-sm capitalize">
            {format(new Date(), "EEEE, dd 'de' MMMM", {
              locale: ptBR,
            })}
          </p>
        </motion.div>

        {/* Barra de pesquisa */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
        >
          <SearchBar />
        </motion.div>

        {/* Busca rápida */}
        <motion.div
          className="mt-6 flex gap-3 overflow-x-auto pb-1 lg:flex-wrap lg:justify-center lg:overflow-visible [&::-webkit-scrollbar]:hidden"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
        >
          {[
            { src: "/cabeloIcon.png", label: "Cabelo", service: "Cabelo" },
            { src: "/barbarIcon.png", label: "Barba", service: "Barba" },
            {
              src: "/acabamentoIcon.png",
              label: "Acabamento",
              service: "Acabamento",
            },
            {
              src: "/acabamentoIcon.png",
              label: "Barbearias perto de você",
              href: "/map",
            },
            { src: "/acabamentoIcon.png", label: "Luzes", service: "Luzes" },
            {
              src: "/acabamentoIcon.png",
              label: "Sobrancelha",
              service: "Sobrancelha",
            },
            {
              src: "/cabeloIcon.png",
              label: "Corte infantil",
              service: "Infantil",
            },
          ].map(({ src, label, service, href }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              <Button
                type="button"
                onClick={() =>
                  router.push(
                    href ??
                      `/barbershops?service=${encodeURIComponent(service ?? "")}`,
                  )
                }
                className="bg-card dark:bg-secondary cursor-pointer gap-1 p-4 whitespace-nowrap hover:bg-[#C3F32C]"
                variant="secondary"
              >
                <span
                  role="img"
                  aria-label={label}
                  style={{
                    WebkitMaskImage: `url(${src})`,
                    maskImage: `url(${src})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                  className="h-4 w-4 shrink-0 bg-[#254F50] dark:bg-white"
                />
                <span className="ml-1">{label}</span>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="hidden gap-3 lg:grid lg:grid-cols-[1.08fr_0.92fr]"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
        >
          <section className="border-border/70 bg-card/90 min-h-[212px] rounded-2xl border p-7 shadow-sm backdrop-blur-sm">
            <h2 className="mb-5 text-xl font-semibold tracking-tight">
              Último agendamento
            </h2>

            {nextBooking ? (
              <button
                type="button"
                onClick={() =>
                  router.push(`/barbershops/${nextBooking.barbershop.id}`)
                }
                className="group bg-background/70 flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-[#a9cf44]/70 p-4 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#8db719] hover:bg-[#f8fdea] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#9bc826] focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:bg-[#1d2918]"
              >
                <Avatar className="bg-muted size-20 shrink-0 border-2 border-[#9bc826]">
                  <AvatarImage
                    src={nextBooking.barbershop.imageUrl}
                    alt={nextBooking.barbershop.name}
                    className="object-cover"
                  />
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">
                    {nextBooking.barbershop.name}
                  </p>
                  <p className="text-muted-foreground mt-1 truncate text-sm">
                    {nextBooking.service.name}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm font-medium capitalize">
                    {format(
                      new Date(nextBooking.date),
                      "dd 'de' MMMM · HH:mm",
                      {
                        locale: ptBR,
                      },
                    )}
                  </p>
                </div>

                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#254F50] text-[#C3F32C] transition-transform duration-200 group-hover:translate-x-1">
                  <ChevronRight className="size-7" strokeWidth={2.25} />
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/barbershops")}
                className="border-border bg-background/60 flex min-h-[112px] w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-5 text-left transition-colors hover:border-[#9bc826]/70 hover:bg-[#f8fdea] dark:hover:bg-[#1d2918]"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-[#C3F32C]/20 text-[#597214]">
                  <CalendarDays className="size-6" />
                </span>
                <span>
                  <strong className="block font-semibold">
                    Nenhum agendamento futuro
                  </strong>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    Encontre uma barbearia para agendar.
                  </span>
                </span>
              </button>
            )}
          </section>

          <section className="border-border/70 bg-card/90 min-h-[212px] rounded-2xl border p-7 shadow-sm backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Favoritos
              </h2>
              <button
                type="button"
                onClick={() => router.push("/favorites")}
                className="cursor-pointer text-sm font-semibold text-[#84ad11] transition-colors hover:text-[#62830a] focus-visible:ring-2 focus-visible:ring-[#9bc826] focus-visible:outline-none dark:text-[#C3F32C]"
              >
                Editar
              </button>
            </div>

            {favoriteBarbershops.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {favoriteBarbershops.map((barbershop) => {
                  const averageRating = barbershop.reviews.length
                    ? barbershop.reviews.reduce(
                        (sum, review) => sum + review.rating,
                        0,
                      ) / barbershop.reviews.length
                    : null

                  return (
                    <button
                      type="button"
                      key={barbershop.id}
                      onClick={() =>
                        router.push(`/barbershops/${barbershop.id}`)
                      }
                      className="group flex min-w-0 cursor-pointer flex-col items-center rounded-xl px-1 py-1 text-center focus-visible:ring-2 focus-visible:ring-[#9bc826] focus-visible:outline-none"
                    >
                      <span className="relative mb-2 block size-[84px]">
                        <span className="bg-muted relative block size-full overflow-hidden rounded-full border-2 border-[#9bc826] shadow-sm transition-transform duration-200 group-hover:scale-[1.04]">
                          <Image
                            src={barbershop.imageUrl}
                            alt={barbershop.name}
                            fill
                            sizes="84px"
                            className="object-cover"
                          />
                        </span>

                        {averageRating !== null && (
                          <span className="absolute -top-1 -right-2 inline-flex items-center gap-0.5 rounded-full bg-[#254F50] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                            <Star className="size-3 fill-[#C3F32C] text-[#C3F32C]" />
                            {averageRating.toFixed(1)}
                          </span>
                        )}

                        <span className="border-card absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 bg-[#254F50] shadow-sm">
                          <Heart className="size-4 fill-[#C3F32C] text-[#C3F32C]" />
                        </span>
                      </span>
                      <span className="line-clamp-2 text-sm leading-tight font-semibold">
                        {barbershop.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/barbershops")}
                className="border-border flex min-h-[124px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition-colors hover:border-[#9bc826]/70 hover:bg-[#f8fdea] dark:hover:bg-[#1d2918]"
              >
                <Heart className="mb-2 size-6 text-[#9bc826]" />
                <strong className="text-sm font-semibold">
                  Salve suas barbearias preferidas
                </strong>
                <span className="text-muted-foreground mt-1 text-xs">
                  Elas aparecerão aqui para acesso rápido.
                </span>
              </button>
            )}
          </section>
        </motion.div>

        {/* Carrossel de banners */}
        <motion.div
          className="border-border/50 relative w-full overflow-hidden rounded-2xl border shadow-sm lg:rounded-3xl"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          whileHover={{ scale: 1.015 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
          }}
        >
          <Carousel
            setApi={setBannerApi}
            opts={{ loop: true }}
            aria-label="Destaques da Régua Máxima"
          >
            <CarouselContent className="ml-0">
              {homeBanners.map((banner, index) => (
                <CarouselItem key={banner.light} className="pl-0">
                  <div className="relative aspect-[1983/793] w-full">
                    <Image
                      src={banner.light}
                      alt={banner.alt}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 1216px, 100vw"
                      className="object-cover dark:hidden"
                    />
                    <Image
                      src={banner.dark}
                      alt={banner.alt}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 1216px, 100vw"
                      className="hidden object-cover dark:block"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="absolute right-0 bottom-3 left-0 z-10 flex justify-center gap-2 sm:bottom-4">
              {homeBanners.map((banner, index) => (
                <button
                  key={banner.light}
                  type="button"
                  aria-label={`Ir para o banner ${index + 1}`}
                  aria-current={activeBanner === index ? "true" : undefined}
                  onClick={() => bannerApi?.scrollTo(index)}
                  className={`h-2 cursor-pointer rounded-full shadow-sm transition-all ${
                    activeBanner === index
                      ? "w-6 bg-[#254F50] dark:bg-[#C3F32C]"
                      : "w-2 bg-white/80 hover:bg-white dark:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </Carousel>
        </motion.div>

        <div className="space-y-6 lg:space-y-8">
          <PendingBookingReviews initialReviews={pendingReviews} />

          {/* ✅ Agendamentos — só aparece se tiver algum */}
          {confirmedBookings.length > 0 && (
            <div className="space-y-6 lg:hidden">
              <motion.h2
                className="text-xs font-bold uppercase"
                variants={fadeIn}
                initial="hidden"
                animate="show"
                custom={4}
              >
                {confirmedBookings.length > 1
                  ? `Agendados (${confirmedBookings.length})`
                  : "Agendado"}
              </motion.h2>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={5}
              >
                <Carousel>
                  <CarouselContent className="-ml-2">
                    {bookingsToShow.map((booking) => (
                      <CarouselItem
                        key={booking.id}
                        className="basis-[90%] pl-2 sm:basis-[60%] lg:basis-1/2 xl:basis-1/3"
                      >
                        <Card
                          className="cursor-pointer hover:bg-[#E6F4D4] hover:bg-black dark:hover:bg-[#262626]"
                          onClick={() => router.push(`/appointments`)}
                        >
                          <CardContent className="flex justify-between p-0">
                            <div className="flex items-center gap-3 py-5 pl-5">
                              <Avatar className="h-14 w-14 border-2 border-solid border-white">
                                <AvatarImage
                                  src={booking.barbershop.imageUrl}
                                  alt={booking.barbershop.name}
                                />
                              </Avatar>
                              <div className="flex flex-col gap-2">
                                <Badge
                                  variant="outline"
                                  className="w-fit bg-[#C3F32C] font-bold text-[#254F50]"
                                >
                                  Confirmado
                                </Badge>
                                <h3 className="font-semibold">
                                  {booking.service.name}
                                </h3>
                                <span className="inline-flex items-center gap-1 text-sm">
                                  <MapPin size={14} />
                                  <span>{booking.barbershop.name}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
                              <p className="text-sm capitalize">
                                {format(new Date(booking.date), "MMMM", {
                                  locale: ptBR,
                                })}
                              </p>
                              <p className="text-2xl font-bold">
                                {format(new Date(booking.date), "dd")}
                              </p>
                              <p className="text-sm font-bold">
                                {format(new Date(booking.date), "HH:mm")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </motion.div>
            </div>
          )}

          {/* Recomendações */}
          <div className="flex items-center justify-between">
            <motion.h2
              className="text-xs font-bold uppercase"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              custom={6}
            >
              Recomendações
            </motion.h2>

            <motion.div
              className="flex items-center gap-3 text-xs font-bold uppercase"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              custom={6}
            >
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                onClick={() => router.push("/barbershops")}
              >
                Todas
              </button>
              <button
                type="button"
                className="cursor-pointer text-lime-500 transition-colors hover:text-lime-600 dark:text-lime-400"
                onClick={() => router.push("/map")}
              >
                Mapa
              </button>
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-2 gap-3 pb-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={7}
          >
            {barbershops.slice(0, 8).map((barbershop, i) => (
              <motion.div
                key={barbershop.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={7 + i * 0.5}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`min-w-0 pt-2 ${i >= 6 ? "hidden lg:block" : ""}`}
              >
                <BarbershopItem barbershop={barbershop} />
              </motion.div>
            ))}
          </motion.div>

          {/* Populares */}
          <div className="flex items-center justify-between">
            <motion.h2
              className="text-xs font-bold uppercase"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              custom={9}
            >
              Populares
            </motion.h2>
            <motion.button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-bold uppercase transition-colors"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              custom={9}
              onClick={() => router.push("/barbershops")}
            >
              Todas
            </motion.button>
          </div>

          <motion.div
            className="grid grid-cols-2 gap-3 pb-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={10}
          >
            {popularBarbershops.slice(0, 8).map((barbershop, i) => (
              <motion.div
                key={barbershop.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                custom={10 + i * 0.5}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`min-w-0 pt-2 ${i >= 6 ? "hidden lg:block" : ""}`}
              >
                <BarbershopItem barbershop={barbershop} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
