
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import AuthProvider from "./_providers/auth"
import { ThemeProvider } from "./_components/theme-provider"
import { ToasterWithTheme } from "./_components/toaster-with-theme"
import Footer from "@/app/_components/ui/footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Régua Máxima",
    template: "%s | Régua Máxima",
  },
  description:
    "Sistema de gestão para barbearias organizarem agendamentos, clientes, equipe e finanças.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full custom-scrollbar overflow-y-auto"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <div className="flex min-h-dvh w-full flex-col">
            <AuthProvider>
              <div className="min-h-dvh w-full flex-1">{children}</div>
            </AuthProvider>
            <Footer />
          </div>
          <ToasterWithTheme />
        </ThemeProvider>
      </body>
    </html>
  )
}

