"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Check, Store } from "lucide-react"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { cn } from "@/lib/utils"

interface WardrobeCarouselProps {
  items: WardrobeItem[]
  onList: (id: string) => void
}

export function WardrobeCarousel({ items, onList }: WardrobeCarouselProps) {
  const [active, setActive] = useState(0)
  const [radius, setRadius] = useState(340)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)

  const count = items.length
  const step = count > 0 ? 360 / count : 0

  // Reset to first item whenever the item set changes (e.g. new category).
  useEffect(() => {
    setActive(0)
  }, [items])

  // Responsive radius so the rack scales gracefully on any screen.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      setRadius(Math.max(200, Math.min(w * 0.4, 380)))
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
      <div className="flex h-[340px] w-full items-center justify-center text-sm text-muted-foreground">
        No items in this category yet.
      </div>
    )
  }

  const activeItem = items[active]

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ perspective: "1400px" }}
        onPointerDown={(e) => {
          dragStart.current = e.clientX
        }}
        onPointerUp={(e) => {
          if (dragStart.current === null) return
          const delta = e.clientX - dragStart.current
          if (delta > 60) rotate(-1)
          else if (delta < -60) rotate(1)
          dragStart.current = null
        }}
      >
        <div className="relative mx-auto h-[320px] w-full sm:h-[380px]" style={{ transformStyle: "preserve-3d" }}>
          {items.map((item, i) => {
            let rel = (i - active) * step
            if (rel > 180) rel -= 360
            if (rel < -180) rel += 360
            const rad = (rel * Math.PI) / 180
            const depth = Math.cos(rad) // 1 at front, -1 at back
            const scale = 0.58 + ((depth + 1) / 2) * 0.42
            const opacity = 0.2 + ((depth + 1) / 2) * 0.8
            const isFront = i === active

            return (
              <motion.button
                key={item.id}
                aria-label={`${item.name} by ${item.brand}`}
                onClick={() => setActive(i)}
                className="absolute left-1/2 top-1/2 -ml-[100px] -mt-[140px] h-[280px] w-[200px] cursor-pointer rounded-3xl focus:outline-none"
                animate={{
                  transform: `rotateY(${rel}deg) translateZ(${radius}px) scale(${scale})`,
                  opacity,
                  zIndex: Math.round(depth * 100),
                }}
                transition={{ type: "spring", stiffness: 90, damping: 18 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className={cn(
                    "flex h-full w-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-all",
                    isFront ? "shadow-xl" : "",
                    item.listed ? "border-primary ring-2 ring-primary/40" : "border-border",
                  )}
                >
                  <div className="relative flex flex-1 items-center justify-center bg-secondary p-4">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      crossOrigin="anonymous"
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                      {item.tag}
                    </span>
                  </div>
                  <div className="border-t border-border px-4 py-3 text-left">
                    <p className="truncate text-sm font-medium text-card-foreground">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.brand}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center gap-6">
        <button
          onClick={() => rotate(-1)}
          aria-label="Previous item"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-[150px] text-center">
          <p className="text-sm font-medium text-foreground">{activeItem.brand}</p>
          <p className="text-xs text-muted-foreground">Worn {activeItem.wears}×</p>
        </div>

        <button
          onClick={() => rotate(1)}
          aria-label="Next item"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* List on Marketplace */}
      <button
        onClick={() => onList(activeItem.id)}
        disabled={activeItem.listed}
        className={cn(
          "mt-5 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
          activeItem.listed
            ? "cursor-default bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground hover:opacity-90",
        )}
      >
        {activeItem.listed ? (
          <>
            <Check className="h-4 w-4" /> Listed on Marketplace
          </>
        ) : (
          <>
            <Store className="h-4 w-4" /> List on Marketplace
          </>
        )}
      </button>

      {/* Dots */}
      <div className="mt-5 flex items-center gap-2">
        {items.map((item, i) => (
          <button
            key={item.id}
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
