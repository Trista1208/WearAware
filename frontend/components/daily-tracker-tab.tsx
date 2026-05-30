"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Flame, Moon, Sparkles, Store, Wand2 } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { logDailyWear } from "@/lib/api"
import { getUsageFilter } from "@/lib/sustainability"
import { GarmentImage } from "@/components/garment-image"
import { cn } from "@/lib/utils"
import { goldBorder, goldBorderSoft } from "@/lib/design-tokens"

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
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-balance font-serif text-4xl font-light tracking-tight text-[#2C2C2C] sm:text-[2.875rem]"
        >
          Daily Tracker
        </motion.h1>
        <p className="mt-2.5 text-pretty text-[14px] text-muted-foreground">
          Log what you wear and let your wardrobe earn its keep.
        </p>
      </div>

      {/* Worn today picker */}
      <section>
        <h2 className="mb-4 text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Select an item you wore today
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => {
            const isActive = selected === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => setSelected(isActive ? null : item.id)}
                whileHover={{ y: -3 }}
                className={cn(
                  "flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl bg-[#FFFFF8] text-left transition-shadow sm:w-32",
                  goldBorder,
                  isActive
                    ? "shadow-[0_0_0_2px_rgba(94,110,85,0.6),0_10px_28px_rgba(94,110,85,0.18)]"
                    : "shadow-[0_2px_10px_rgba(201,169,106,0.1)] hover:shadow-[0_10px_28px_rgba(201,169,106,0.18)]",
                )}
              >
                <div className="flex h-24 items-center justify-center overflow-hidden bg-gradient-to-b from-[#FDF6EC] to-[#F2E4D4] p-2.5">
                  <GarmentImage item={item} style={{ filter: getUsageFilter(item.wears) }} />
                </div>
                <span className="truncate border-t border-[rgba(196,160,92,0.34)] px-2.5 py-2 text-[12px] font-medium text-card-foreground">
                  {item.name}
                </span>
              </motion.button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleWornToday}
          disabled={!selected}
          className={cn(
            "mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all",
            selected
              ? "bg-gradient-to-b from-[#6A7A60] to-[#54634C] text-[#FFFFF8] shadow-[0_3px_12px_rgba(94,110,85,0.32),inset_0_1px_0_rgba(232,214,170,0.5)] ring-1 ring-[rgba(212,180,118,0.5)] hover:opacity-95"
              : "cursor-not-allowed bg-[rgba(180,165,140,0.16)] text-muted-foreground",
          )}
        >
          <Check className="h-4 w-4" /> Worn Today
        </button>
      </section>

      {/* Rotation + dormant cards */}
      <section className="grid gap-4 md:grid-cols-2">
        <div
          className={cn(
            "rounded-3xl p-6 sm:p-7",
            goldBorder,
            "bg-gradient-to-br from-[#FFFCF7]/92 to-[#FBF3E6]/85 shadow-[inset_0_1px_0_rgba(255,255,248,1),0_8px_28px_rgba(201,169,106,0.1)]",
          )}
        >
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(196,142,112,0.14)] text-[#A0583C]">
              <Flame className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-[1.3rem] font-light text-[#2C2C2C]">Highest Rotation</h3>
          </div>
          <ul className="flex flex-col gap-3.5">
            {topRotation.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className={cn("flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FDF6EC] to-[#F1E4D2]", goldBorderSoft)}>
                  <GarmentImage item={item} imgClassName="p-1.5" />
                </div>
                <span className="min-w-0 flex-1 truncate text-[14px] text-card-foreground">{item.name}</span>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#5E6E55]">{item.wears}×</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(
            "rounded-3xl p-6 sm:p-7",
            goldBorder,
            "bg-gradient-to-br from-[#FFFCF7]/92 to-[#FBF3E6]/85 shadow-[inset_0_1px_0_rgba(255,255,248,1),0_8px_28px_rgba(201,169,106,0.1)]",
          )}
        >
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(122,140,110,0.14)] text-[#5E6E55]">
              <Moon className="h-4 w-4" />
            </span>
            <h3 className="font-serif text-[1.3rem] font-light text-[#2C2C2C]">Dormant Items</h3>
          </div>
          {dormant.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">Nothing dormant — your wardrobe is working hard.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {dormant.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className={cn("flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FDF6EC] to-[#F1E4D2]", goldBorderSoft)}>
                    <GarmentImage item={item} imgClassName="p-1.5" style={{ filter: getUsageFilter(item.wears) }} />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-card-foreground">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.listed) return
                      onList(item.id)
                      toast.success(`${item.name} sent to Marketplace.`)
                    }}
                    disabled={item.listed}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
                      item.listed
                        ? "border border-[rgba(94,110,85,0.4)] bg-transparent text-[#5E6E55]"
                        : "bg-gradient-to-b from-[#6A7A60] to-[#54634C] text-[#FFFFF8] ring-1 ring-[rgba(212,180,118,0.45)] hover:opacity-95",
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
      <section
        className={cn(
          "rounded-3xl p-7 sm:p-8",
          goldBorder,
          "bg-gradient-to-br from-[#FFFCF7]/92 to-[#FBF3E6]/85 shadow-[inset_0_1px_0_rgba(255,255,248,1),0_8px_28px_rgba(201,169,106,0.1)]",
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#6A7A60] to-[#54634C] text-[#FFFFF8] ring-1 ring-[rgba(212,180,118,0.45)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-serif text-[1.5rem] font-light text-[#2C2C2C]">AI Stylist</h3>
            <p className="mt-1 text-[14px] text-muted-foreground">Generate a fit from pieces you already own.</p>
          </div>
          <button
            type="button"
            onClick={generateFit}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#6A7A60] to-[#54634C] px-5 py-2.5 text-[13px] font-medium text-[#FFFFF8] shadow-[0_3px_12px_rgba(94,110,85,0.32),inset_0_1px_0_rgba(232,214,170,0.5)] ring-1 ring-[rgba(212,180,118,0.5)] transition-opacity hover:opacity-95 disabled:opacity-70"
          >
            <Wand2 className="h-4 w-4" /> {generating ? "Styling…" : "Generate Fit for Today"}
          </button>
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
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-[rgba(196,160,92,0.12)]" />
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
                  <div key={i} className={cn("flex flex-col overflow-hidden rounded-2xl bg-[#FFFFF8]", goldBorderSoft)}>
                    <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-b from-[#FDF6EC] to-[#F2E4D4] p-3">
                      {piece ? (
                        <GarmentImage item={piece} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <span className="truncate border-t border-[rgba(196,160,92,0.3)] px-3 py-2 text-[12px] font-medium text-card-foreground">
                      {piece?.name ?? "No item"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-pretty text-center text-[14px] italic text-muted-foreground">{outfit.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}
