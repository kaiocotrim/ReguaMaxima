"use client"

import { cn } from "@/app/_lib/utils"
import { getPasswordValidationError } from "@/app/_lib/password-policy"
import { Button } from "@/app/_components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/app/_components/ui/field"
import { LoginProviders } from "@/app/_components/LoginProviders"
import { Input } from "@/app/_components/ui/input"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { Eye, EyeOff } from "lucide-react"

type Mode = "login" | "register" | "success"

const inputClassName =
  "h-12 rounded-full border border-input bg-card px-5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<Mode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [registeredName, setRegisteredName] = useState("")
  // const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("E-mail ou senha incorretos")
      return
    }

    setError("")

    const profileResponse = await fetch("/api/user/profile-check")
    const profileData = await profileResponse.json()

    window.location.href = profileData.hasProfile ? "/inicio" : "/perfil"
  }
  const handleModeSwitch = (next: Mode) => {
    setMode(next)
    setShowPassword(false)
    setShowRegisterPassword(false)
    setShowConfirmPassword(false)
    setForgotOpen(false)
    setError("")
  }

  const handleForgot = () => {
    setForgotOpen((v) => !v)
  }

  const handleForgotPassword = async () => {
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error)
        return
      }

      alert(
        data.message ??
          "Se existir uma conta com esse e-mail, enviaremos as instruções.",
      )
    } catch (error) {
      console.error("ERRO:", error)
      alert("Erro ao enviar e-mail")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (registerPassword !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    const passwordError = getPasswordValidationError(registerPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? "Não foi possível criar a conta. Tente novamente.")
        return
      }

      setRegisteredName(name)
      setMode("success")

      await signIn("credentials", {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      })

      setTimeout(() => {
        window.location.href = "/perfil"
      }, 3000)
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.")
    }
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center bg-background px-6 py-12 text-foreground",
        className,
      )}
      {...props}
    >
      <div className="w-full max-w-[400px] space-y-8">
        {/* Logo + título */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Image
              src="/logoPretoBrancoFundoOFF.png"
              alt="Régua Máxima"
              width={56}
              height={24}
              className="h-auto w-14 dark:invert"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-center text-3xl font-bold tracking-tight text-foreground"
            >
              {mode === "login"
                ? "Entre na sua conta"
                : mode === "register"
                  ? "Crie sua conta"
                  : "Tudo certo!"}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Providers + divisor */}
        <AnimatePresence>
          {mode === "login" && (
            <motion.div
              key="providers"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-8 overflow-hidden"
            >
              <LoginProviders />
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="mx-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">ou</span>
                <div className="flex-1 border-t border-border" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulários */}
        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {mode === "login" && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              onSubmit={(e) => {
                if (forgotOpen) {
                  e.preventDefault()
                  handleForgotPassword()
                } else {
                  handleSubmit(e)
                }
              }}
              className="space-y-3"
            >
              <FieldGroup className="space-y-0">
                <Field className="space-y-2">
                  <FieldLabel htmlFor="email" className="text-sm font-bold text-foreground">
                    E-mail ou nome de usuário
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="E-mail ou nome de usuário"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setShowPassword(true)}
                    className={inputClassName}
                  />
                </Field>

                <AnimatePresence>
                  {showPassword && (
                    <motion.div
                      key="login-password"
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <Field className="space-y-2 pt-3">
                        <div className="flex items-center justify-between">
                          <FieldLabel htmlFor="password" className="text-sm font-bold text-foreground">
                            Senha
                          </FieldLabel>
                          <button
                            type="button"
                            onClick={handleForgot}
                            className={cn(
                              "text-xs transition-colors",
                              forgotOpen ? "text-primary" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Esqueceu a senha?
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {forgotOpen ? (
                            <motion.div
                              key="forgot-info"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="border-t border-border pt-3"
                            >
                              <div className="flex flex-col gap-1">
                                <p className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  Recuperação de senha
                                </p>
                                <p className="pl-[18px] text-[12px] leading-relaxed text-muted-foreground">
                                  Enviaremos um link para o{" "}
                                  <span className="font-medium text-foreground/70">e-mail cadastrado</span>.
                                  Verifique também a pasta de spam.
                                </p>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="password-input"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                              <Input
                                id="password"
                                type="password"
                                placeholder="Senha"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClassName}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </FieldGroup>

              <motion.div layout transition={{ duration: 0.25 }}>
                <Button
                  type="submit"
                  className="mt-1 h-12 w-full cursor-pointer rounded-full bg-[#C3F32C] text-sm font-bold text-[#121212] transition-all hover:scale-[1.02] hover:bg-[#d4ff30] active:scale-[0.98]"
                >
                  {forgotOpen ? "Enviar link" : showPassword ? "Entrar" : "Continuar"}
                </Button>
                {error && (
                  <p className="mt-2 text-center text-xs text-red-500">{error}</p>
                )}
              </motion.div>
            </motion.form>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              onSubmit={handleRegister}
              className="space-y-3"
            >
              <FieldGroup className="space-y-3">
                <Field className="space-y-2">
                  <FieldLabel htmlFor="reg-name" className="text-sm font-bold text-foreground">
                    Nome de usuário
                  </FieldLabel>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id="reg-name"
                    type="text"
                    placeholder="seu nome de usuário"
                    required
                    autoComplete="username"
                    className={inputClassName}
                  />
                </Field>

                <Field className="space-y-2">
                  <FieldLabel htmlFor="reg-email" className="text-sm font-bold text-foreground">
                    E-mail
                  </FieldLabel>
                  <Input
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    id="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    className={inputClassName}
                  />
                </Field>

                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.28, delay: 0.05, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <Field className="space-y-2">
                    <FieldLabel htmlFor="reg-password" className="text-sm font-bold text-foreground">
                      Senha
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        id="reg-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Crie uma senha"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((value) => !value)}
                        aria-label={showRegisterPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showRegisterPassword}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use 8 ou mais caracteres e combine pelo menos 3 tipos: minúscula, maiúscula, número e símbolo.
                    </p>
                  </Field>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.28, delay: 0.1, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <Field className="space-y-2">
                    <FieldLabel htmlFor="reg-confirm" className="text-sm font-bold text-foreground">
                      Confirmar senha
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        id="reg-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={showConfirmPassword}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </Field>
                </motion.div>
              </FieldGroup>

              <Button
                type="submit"
                className="mt-1 h-12 w-full cursor-pointer rounded-full bg-[#C3F32C] text-sm font-bold text-[#121212] transition-all hover:scale-[1.02] hover:bg-[#d4ff30] active:scale-[0.98]"
              >
                Criar conta
              </Button>
              {error && (
                <p role="alert" className="text-center text-xs text-red-500">
                  {error}
                </p>
              )}
            </motion.form>
          )}

          {/* SUCCESS */}
          {mode === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 py-2 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
              >
                <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
                  <circle
                    cx="44"
                    cy="44"
                    r="32"
                    strokeWidth="3.5"
                    className="stroke-border"
                  />
                  <motion.circle
                    cx="44" cy="44" r="32"
                    stroke="#C3F32C" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray="201"
                    initial={{ strokeDashoffset: 201 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 0.75, delay: 0.3, ease: "easeOut" }}
                    style={{ rotate: "-90deg", transformOrigin: "center" }}
                  />
                  <motion.polyline
                    points="28,45 39,56 60,33"
                    stroke="#C3F32C" strokeWidth="4.5" strokeLinecap="round"
                    strokeLinejoin="round" fill="none" strokeDasharray="65"
                    initial={{ strokeDashoffset: 65 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 0.38, delay: 1.0, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15, duration: 0.3 }}
                className="space-y-1"
              >
                <h2 className="text-2xl font-bold text-foreground">Conta criada!</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Tudo certo,{" "}
                  <span className="font-semibold text-foreground">{registeredName}</span>.
                  <br />
                  Vamos configurar seu perfil agora.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.3 }}
                className="w-full space-y-3"
              >
                <p className="text-xs text-muted-foreground">Redirecionando em 3s...</p>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-[#C3F32C]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, delay: 1.4, ease: "linear" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alternar login / cadastro */}
        <AnimatePresence mode="wait">
          {(mode === "login" || mode === "register") && (
            <motion.p
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center text-sm text-muted-foreground"
            >
              {mode === "login" ? (
                <>
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("register")}
                    className="cursor-pointer font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("login")}
                    className="cursor-pointer font-bold text-foreground underline underline-offset-2 transition-colors hover:text-primary"
                  >
                    Entrar
                  </button>
                </>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay fade — só no login, não no registro */}
        {/* <AnimatePresence>
          {isLogging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="fixed inset-0 z-50 bg-black"
            />
          )}
        </AnimatePresence> */}
    </div>
  )
}

export default LoginForm
