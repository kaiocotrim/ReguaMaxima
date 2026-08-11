"use client"

import Image from "next/image"
import MenuBtn from "./ui/MenuBtn"
import Link from "next/link"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { MobileBottomNavigation } from "./mobile-bottom-navigation"

const Header = () => {
  const [jumpCount, setJumpCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  function handleLogoClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setJumpCount((count) => count + 1)

    if (pathname !== "/") {
      window.setTimeout(() => router.push("/inicio"), 430)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur lg:top-4 lg:mx-auto lg:w-[calc(100%_-_3rem)] lg:max-w-6xl lg:rounded-2xl lg:border lg:border-white/10 lg:bg-background/40 lg:shadow-[0_1px_0_rgba(255,255,255,0.04),0_14px_40px_rgba(0,0,0,0.08)] lg:backdrop-blur-2xl lg:backdrop-saturate-150 dark:lg:bg-background/30">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-6">
        <Link
          href="/inicio"
          aria-label="Ir para o início"
          onClick={handleLogoClick}
        >
          <span
            key={jumpCount}
            className={jumpCount > 0 ? "ruler-logo-jump block" : "block"}
          >
            <Image
              src="/LogoMComBorder3.png"
              alt="BarberCloud Logo"
              width={60}
              height={50}
              className="ruler-logo-animation h-auto w-14 lg:w-16"
            />
          </span>
        </Link>

          <MenuBtn />
        </div>
      </header>
      <MobileBottomNavigation />
    </>
  )
}

export default Header
