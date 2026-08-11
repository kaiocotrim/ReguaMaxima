"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

const easeOut = [0.23, 1, 0.32, 1] as const

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(16%)" }}
      whileInView={{ opacity: 1, transform: "translateY(0)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0.2 : 0.7, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  )
}

export function JarMotion({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(18%) scale(0.94) rotate(-3deg)" }}
      whileInView={{ opacity: 1, transform: "translateY(0) scale(1) rotate(0deg)" }}
      viewport={{ once: true, amount: 0.45 }}
      transition={
        reduceMotion
          ? { duration: 0.2, ease: easeOut }
          : { type: "spring", duration: 0.8, bounce: 0.22 }
      }
    >
      {children}
    </motion.div>
  )
}

export function DonationCoin({
  children,
  className,
  title,
  delay,
}: {
  children: ReactNode
  className?: string
  title: string
  delay: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      className={className}
      title={title}
      initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(-260%) rotate(-28deg) scale(0.94)" }}
      whileInView={{ opacity: 1, transform: "translateY(0) rotate(0deg) scale(1)" }}
      viewport={{ once: true, amount: 0.8 }}
      transition={
        reduceMotion
          ? { duration: 0.2, delay }
          : { type: "spring", duration: 0.85, bounce: 0.28, delay }
      }
    >
      {children}
    </motion.span>
  )
}

export function DonationProgress({ progress, className }: { progress: number; className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.5, transform: reduceMotion ? `scaleX(${progress})` : "scaleX(0)" }}
      whileInView={{ opacity: 1, transform: `scaleX(${progress})` }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: reduceMotion ? 0.2 : 1, delay: reduceMotion ? 0 : 0.35, ease: easeOut }}
    />
  )
}
