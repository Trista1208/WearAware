"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, animate } from "framer-motion"
import { cn } from "@/lib/utils"

interface AwareScoreRingProps {
  score: number
  className?: string
  size?: "default" | "hero"
}

export function AwareScoreRing({ score, className, size = "default" }: AwareScoreRingProps) {
  const motionScore = useMotionValue(0)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const controls = animate(motionScore, score, {
      duration: 1.6,
      ease: [0.0, 0.0, 0.2, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return controls.stop
  }, [score, motionScore])

  const isHero = size === "hero"
  const dim = isHero ? 128 : 92
  const stroke = 2.25
  const radius = (dim - stroke * 2) / 2 - 4
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const scoreColor =
    score >= 70 ? "#4A5A42" : score >= 45 ? "#6B5E3E" : "#8A5A48"
  const ringTrack = "rgba(180, 165, 140, 0.14)"
  const ringFill =
    score >= 70
      ? "rgba(122, 140, 110, 0.65)"
      : score >= 45
        ? "rgba(160, 150, 120, 0.65)"
        : "rgba(180, 130, 110, 0.65)"

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={cn("relative flex items-center justify-center rounded-full", className)}
      style={{
        width: dim,
        height: dim,
        background: "linear-gradient(165deg, #FFFFF8 0%, #F5EFE6 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,248,0.98), 0 6px 28px rgba(201,169,106,0.16), 0 0 0 1px rgba(212,180,118,0.5)",
      }}
    >
      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute inset-2 rounded-full opacity-60"
        style={{
          background: `radial-gradient(circle, ${ringFill.replace("0.65", "0.15")} 0%, transparent 70%)`,
        }}
      />

      <svg
        className="absolute inset-0 -rotate-90"
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        aria-hidden="true"
      >
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke={ringTrack} strokeWidth={stroke} />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={ringFill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.6, ease: [0.0, 0.0, 0.2, 1] }}
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <span
          className={cn(
            "font-serif font-light leading-none tracking-[-0.04em]",
            isHero ? "text-[50px]" : "text-[38px]",
          )}
          style={{ color: scoreColor }}
        >
          {displayScore}
        </span>
        <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-muted-foreground/75">
          Aware
        </span>
      </div>
    </motion.div>
  )
}
