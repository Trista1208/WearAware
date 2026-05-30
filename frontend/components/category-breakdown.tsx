"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { getWardrobeMix } from "@/lib/wardrobe-selectors"
import { categoryColors } from "@/components/category-icons"
import { cn } from "@/lib/utils"

interface CategoryBreakdownProps {
  items: WardrobeItem[]
}

export function CategoryBreakdown({ items }: CategoryBreakdownProps) {
  const segments = useMemo(() => getWardrobeMix(items), [items])
  const wardrobeTotal = segments.reduce((s, seg) => s + seg.count, 0)
  const nonZero = segments.filter((s) => s.count > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, type: "spring", stiffness: 180, damping: 26 }}
      className="border-t border-[rgba(196,160,92,0.5)] pt-7 sm:pt-8"
    >
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-serif text-[1.65rem] font-light tracking-[-0.01em] text-[#2C2C2C] sm:text-[1.8rem]">
            Wardrobe mix
          </h2>
          <p className="mt-2 text-[12px] font-normal tracking-[0.04em] text-muted-foreground">
            {wardrobeTotal} active {wardrobeTotal === 1 ? "piece" : "pieces"}
            <span className="mx-1.5 text-muted-foreground/35">·</span>
            {nonZero.length} {nonZero.length === 1 ? "category" : "categories"}
          </p>
        </div>
      </div>

      {/* Proportional, dynamic bar — each segment width = that category's share */}
      <div className="relative mb-8">
        <div className="flex h-[11px] w-full items-stretch gap-[3px] overflow-hidden rounded-full bg-[rgba(180,165,140,0.1)] p-[2px]">
          {wardrobeTotal === 0 ? (
            <div className="h-full w-full rounded-full bg-[rgba(180,165,140,0.12)]" />
          ) : (
            nonZero.map((seg, i) => (
              <motion.div
                key={seg.category}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${seg.pct}%`, opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.9, ease: [0.0, 0.0, 0.2, 1] }}
                className={cn(
                  "h-full min-w-[8px] rounded-full",
                  categoryColors[seg.category].bar,
                  "shadow-[inset_0_1px_0_rgba(255,255,248,0.55),0_1px_3px_rgba(150,110,70,0.12)]",
                )}
                title={`${seg.category}: ${seg.pct}% · ${seg.count} pcs`}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
        {segments.map((seg) => (
          <div key={seg.category} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", categoryColors[seg.category].bar)} />
              <p className="truncate text-[12px] font-medium tracking-wide text-foreground/85">
                {seg.category}
              </p>
            </div>
            <p className="pl-4 text-[11px] tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground/80">{seg.pct}%</span>
              <span className="mx-1 text-muted-foreground/30">·</span>
              {seg.count} {seg.count === 1 ? "pc" : "pcs"}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
