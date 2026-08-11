"use client"

import Image from "next/image"
import { signIn } from "next-auth/react"
import { Button } from "./ui/button"
 
const LOGIN_PROVIDERS = [
  { id: "google", src: "/google-icon.svg", label: "Google" ,callbackUrl: "/inicio", },
  { id: "facebook", src: "/facebook-icon.svg", label: "Facebook" ,callbackUrl: "/inicio", },
  { id: "apple", src: "/Apple-icon.svg", label: "Apple" ,callbackUrl: "/inicio", },
  { id: "github", src: "/GitHub-icon.svg", label: "GitHub" ,callbackUrl: "/inicio", },
]

export function LoginProviders() {
const handleLogin = async (
  provider: string,
  callbackUrl: string,
) => {
  await signIn(provider, { callbackUrl })
}

  return (
    
    <div className="mt-3 flex flex-col gap-2">
        {LOGIN_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          onClick={() => handleLogin(provider.id, provider.callbackUrl)}
          className="w-full justify-start gap-3 rounded-full bg-[#C3F32C] text-black hover:bg-[#d6f083] cursor-pointer"
        >
          <Image
            src={provider.src}
            alt={provider.label}
            width={16}
            height={16}
          />
          Continuar com {provider.label}
        </Button>
      ))}
      
    </div>
  )
}
