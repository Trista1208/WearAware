"use client"

import { type DragEvent, useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, HeartHandshake, RotateCcw } from "lucide-react"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { getUsageFilter } from "@/lib/sustainability"
import { GarmentImage } from "@/components/garment-image"
import { cn } from "@/lib/utils"
import { goldBorder, goldBorderSoft } from "@/lib/design-tokens"

interface WardrobeCarouselProps {
  items: WardrobeItem[]
  onSelect: (item: WardrobeItem) => void
  onMoveToReady?: (id: string) => void
  onRemoveFromReady?: (id: string) => void
}

export function WardrobeCarousel({ items, onSelect, onMoveToReady, onRemoveFromReady }: WardrobeCarouselProps) {
  const [active, setActive] = useState(0)
  const [radius, setRadius] = useState(400)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)

  const count = items.length
  const step = count > 0 ? 360 / count : 0

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      setRadius(Math.max(210, Math.min(w * 0.42, 400)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rotate = useCallback(
    (dir: number) => {
      if (count === 0) return
      setActive((prev) => (prev + dir + count) % count)
    },
    [count],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") rotate(-1)
      if (e.key === "ArrowRight") rotate(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [rotate])

  if (count === 0) {
    return (
      <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 text-sm text-muted-foreground">
        No pieces in this category yet — add one on the left.
      </div>
    )
  }

  const activeItem = items[active]

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ perspective: "1600px" }}
        onPointerDown={(e) => {
          dragStart.current = e.clientX
        }}
        onPointerUp={(e) => {
          if (dragStart.current === null) return
          const delta = e.clientX - dragStart.current
          if (delta > 50) rotate(-1)
          else if (delta < -50) rotate(1)
          dragStart.current = null
        }}
      >
        {/* Cylinder backdrop */}
        <div className={cn("pointer-events-none absolute inset-x-[12%] top-[8%] h-[72%] rounded-[50%] bg-gradient-to-b from-[rgba(255,235,210,0.5)] to-[rgba(248,220,190,0.2)]", goldBorderSoft)} />

        <div className="relative mx-auto h-[400px] w-full sm:h-[470px]" style={{ transformStyle: "preserve-3d" }}>
          {items.map((item, i) => {
            let rel = (i - active) * step
            if (rel > 180) rel -= 360
            if (rel < -180) rel += 360
            const rad = (rel * Math.PI) / 180
            const depth = Math.cos(rad)
            const scale = 0.55 + ((depth + 1) / 2) * 0.45
            const opacity = 0.18 + ((depth + 1) / 2) * 0.82
            const isFront = i === active

            return (
              <motion.div
                key={item.id}
                draggable={item.status === "wardrobe"}
                onDragStart={(e) => {
                  // motion.div has no `drag` prop, so this is the native drag event
                  const { dataTransfer } = e as unknown as DragEvent<HTMLDivElement>
                  dataTransfer.setData("text/wearaware-item-id", item.id)
                  dataTransfer.effectAllowed = "move"
                }}
                animate={{
                  transform: `rotateY(${rel}deg) translateZ(${radius}px) scale(${scale})`,
                  opacity,
                  zIndex: Math.round(depth * 100),
                }}
                transition={{ type: "spring", stiffness: 90, damping: 18 }}
                className="absolute left-1/2 top-1/2 -ml-[102px] -mt-[178px] h-[350px] w-[204px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Hanger */}
                <div className="mx-auto flex w-[80px] flex-col items-center">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-[#C9A96A] bg-[#FAF4EC]" />
                  <div className="h-2.5 w-px bg-[#C9A96A]" />
                  <div className="h-2 w-16 rounded-t-full border-t-2 border-x-2 border-[#C9A96A]" />
                </div>

                <motion.button
                  type="button"
                  aria-label={`${item.name} by ${item.brand}`}
                  onClick={() => {
                    setActive(i)
                    if (isFront) onSelect(item)
                  }}
                  whileHover={isFront ? { y: -4 } : undefined}
                  className={cn(
                    "mt-1.5 flex h-[284px] w-full cursor-grab flex-col overflow-hidden rounded-2xl bg-[#FFFFF8] text-left shadow-sm active:cursor-grabbing",
                    goldBorder,
                    isFront ? "shadow-[0_12px_40px_rgba(201,169,106,0.26),0_2px_8px_rgba(180,120,90,0.08)]" : "",
                    item.status !== "wardrobe" ? "opacity-60" : "",
                  )}
                >
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-[#FDF6EC] via-[#FAF1E2] to-[#F2E2CE] p-3">
                    {/* Soft champagne floor glow beneath the garment */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-6 bottom-2 h-6 rounded-[50%] bg-[rgba(201,169,106,0.18)] blur-lg"
                    />
                    <GarmentImage
                      item={item}
                      imgClassName="relative transition-[filter] duration-500"
                      style={{ filter: getUsageFilter(item.wears) }}
                    />
                    {item.wears >= 20 && (
                      <span className="absolute inset-x-3 bottom-3 h-8 rounded-full bg-primary/10 blur-xl" aria-hidden />
                    )}
                  </div>
                  <div className="border-t border-[rgba(196,160,92,0.4)] bg-gradient-to-b from-[#FFFFF8] to-[#FBF5EA] px-3.5 py-2.5">
                    <p className="truncate text-[13px] font-medium text-card-foreground">{item.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">Worn {item.wears}×</p>
                  </div>
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-7">
        <button
          type="button"
          onClick={() => rotate(-1)}
          aria-label="Previous item"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#FFFFF8] to-[#F8F0E2] text-foreground transition-colors hover:bg-secondary",
            goldBorder,
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-[150px] text-center">
          <p className="text-[15px] font-medium text-foreground">{activeItem.name}</p>
          <p className="text-[13px] text-muted-foreground">{activeItem.brand}</p>

          {/* Quick trade toggle — always visible on the front item */}
          {activeItem.status === "wardrobe" && onMoveToReady && (
            <button
              type="button"
              onClick={() => onMoveToReady(activeItem.id)}
              className="mt-2 flex items-center justify-center gap-1 rounded-full border border-[rgba(201,169,106,0.5)] bg-[rgba(248,228,210,0.5)] px-3 py-1 text-[11px] font-medium text-[#7A5A40] transition hover:bg-[rgba(248,228,210,0.8)] mx-auto"
            >
              <HeartHandshake className="h-3 w-3" />
              List for trade
            </button>
          )}
          {activeItem.status === "readyToTrade" && onRemoveFromReady && (
            <button
              type="button"
              onClick={() => onRemoveFromReady(activeItem.id)}
              className="mt-2 flex items-center justify-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/15 mx-auto"
            >
              <RotateCcw className="h-3 w-3" />
              Listed · tap to undo
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => rotate(1)}
          aria-label="Next item"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#FFFFF8] to-[#F8F0E2] text-foreground transition-colors hover:bg-secondary",
            goldBorder,
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to ${item.name}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === active ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground",
            )}
          />
        ))}
      </div>
    </div>
  )
}
