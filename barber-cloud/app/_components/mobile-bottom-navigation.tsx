"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { CalendarCheck2, House, UserRound } from "lucide-react"

export function MobileBottomNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const agendaHref =
    session?.user?.role === "BARBER"
      ? "/dashboard/agendamentos"
      : "/appointments"

  const items = [
    { label: "Início", href: "/inicio", icon: House },
    { label: "Agenda", href: agendaHref, icon: CalendarCheck2 },
    { label: "Conta", href: "/configuracoes", icon: UserRound },
  ]

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-50 mx-auto max-w-md rounded-[2rem] border border-black/[0.06] bg-white/95 p-1.5 shadow-[0_14px_45px_rgba(22,35,31,0.18)] backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-zinc-900/95"
    >
      <div className="grid grid-cols-3 gap-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (label === "Início" && pathname === "/") ||
            (label === "Agenda" && pathname.startsWith(href)) ||
            (label === "Conta" && pathname.startsWith("/configuracoes"))

          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-[1.55rem] px-2 text-[11px] font-semibold transition-[background-color,color,transform] active:scale-95 ${
                active
                  ? "bg-[#C3F32C] text-[#173b3c] shadow-[inset_0_0_22px_rgba(255,255,255,0.28)]"
                  : "text-[#18201c] hover:bg-black/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
