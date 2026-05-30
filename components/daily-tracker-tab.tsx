"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Flame, Moon, Sparkles, Store, Wand2 } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { logDailyWear } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DailyTrackerTabProps {
  items: WardrobeItem[]
  onWear: (id: string) => void
  onList: (id: string) => void
}

interface Outfit {
  top?: WardrobeItem
  bottom?: WardrobeItem
  shoe?: WardrobeItem
  description: string
}

const STYLE_NOTES = [
  "Relaxed and breathable — perfect for a mild, productive day out.",
  "Effortless layering with earthy tones for an understated, mindful look.",
  "Clean lines and natural fibers that move with you from morning to evening.",
]

export function DailyTrackerTab({ items, onWear, onList }: DailyTrackerTabProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [outfit, setOutfit] = useState<Outfit | null>(null)

  const topRotation = useMemo(() => [...items].sort((a, b) => b.wears - a.wears).slice(0, 3), [items])
  const dormant = useMemo(() => items.filter((i) => i.wears <= 1), [items])

  const handleWornToday = async () => {
    if (!selected) return
    const item = items.find((i) => i.id === selected)
    onWear(selected)
    // logDailyWear(itemId) -> POST http://localhost:3000/api/wardrobe/track
    await logDailyWear(selected)
    toast.success(`Logged a wear for ${item?.name ?? "item"}.`)
    setSelected(null)
  }

  const generateFit = () => {
    setGenerating(true)
    setOutfit(null)
    // Simulated AI stylist call with a loading state.
    setTimeout(() => {
      const pick = (cats: string[]) => {
        const pool = items.filter((i) => cats.includes(i.category))
        return pool[Math.floor(Math.random() * pool.length)]
      }
      setOutfit({
        top: pick(["Tops", "Shirts"]),
        bottom: pick(["Jeans", "Shorts"]),
        shoe: pick(["Shoes"]),
        description: STYLE_NOTES[Math.floor(Math.random() * STYLE_NOTES.length)],
      })
      setGenerating(false)
    }, 1400)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Daily Tracker
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Log what you wear and let your wardrobe earn its keep.
        </p>
      </div>

      {/* Worn today picker */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">Select an item you wore today</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item.id)}
              className={cn(
                "flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all",
                selected === item.id ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-muted-foreground",
              )}
            >
              <div className="flex h-24 items-center justify-center bg-secondary p-2">
                <img src={item.image || "/placeholder.svg"} alt={item.name} crossOrigin="anonymous" className="h-full w-full object-contain" />
              </div>
              <span className="truncate px-2 py-1.5 text-xs font-medium text-card-foreground">{item.name}</span>
            </button>
          ))}
        </div>
        <Button onClick={handleWornToday} disabled={!selected} className="mt-3 rounded-full">
          <Check className="h-4 w-4" /> Worn Today
        </Button>
      </section>

      {/* Rotation + dormant cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Flame className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-medium text-card-foreground">Highest Rotation</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {topRotation.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} crossOrigin="anonymous" className="h-full w-full object-contain p-1" />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">{item.name}</span>
                <span className="text-xs font-medium text-muted-foreground">{item.wears}×</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Moon className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-medium text-card-foreground">Dormant Items</h3>
          </div>
          {dormant.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing dormant — your wardrobe is working hard.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {dormant.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} crossOrigin="anonymous" className="h-full w-full object-contain p-1" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">{item.name}</span>
                  <button
                    onClick={() => {
                      onList(item.id)
                      toast.success(`${item.name} sent to Marketplace.`)
                    }}
                    disabled={item.listed}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                      item.listed ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:opacity-90",
                    )}
                  >
                    <Store className="h-3 w-3" /> {item.listed ? "Listed" : "Optimize"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* AI Stylist */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-medium text-card-foreground">AI Stylist</h3>
            <p className="text-sm text-muted-foreground">Generate a fit from pieces you already own.</p>
          </div>
          <Button onClick={generateFit} disabled={generating} className="rounded-full">
            <Wand2 className="h-4 w-4" /> {generating ? "Styling..." : "Generate Fit for Today"}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {generating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 grid grid-cols-3 gap-3"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary" />
              ))}
            </motion.div>
          )}

          {outfit && !generating && (
            <motion.div
              key="outfit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <div className="grid grid-cols-3 gap-3">
                {[outfit.top, outfit.bottom, outfit.shoe].map((piece, i) => (
                  <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background">
                    <div className="flex aspect-[3/4] items-center justify-center bg-secondary p-3">
                      {piece ? (
                        <img src={piece.image || "/placeholder.svg"} alt={piece.name} crossOrigin="anonymous" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <span className="truncate px-3 py-2 text-xs font-medium text-card-foreground">
                      {piece?.name ?? "No item"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-pretty text-center text-sm italic text-muted-foreground">{outfit.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
