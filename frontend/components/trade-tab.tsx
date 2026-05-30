"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeftRight, Bot, Camera, Leaf, Search, Shirt, Sparkles, Upload } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { findTradeMatch, type TradeMatch } from "@/lib/trade-matching"
import { executeTrade, apiTradeInsight, type TradeInsightResult } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GarmentImage } from "@/components/garment-image"
import { cn } from "@/lib/utils"
import { goldBorder } from "@/lib/design-tokens"

interface TradeTabProps {
  readyItems: WardrobeItem[]
  onTradeComplete: (offeringId: string | null, gainedItem: WardrobeItem) => void
  onRequestAuth?: () => void
}

type Owner = "you" | "match"

function AvatarFigure({
  label,
  glow,
  item,
  statusLabel,
}: {
  label: string
  glow: "green" | "red" | "none"
  item: WardrobeItem | null
  statusLabel?: string
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{
          boxShadow:
            glow === "green"
              ? "0 0 0 4px oklch(0.46 0.09 150), 0 0 36px 4px rgba(110,140,95,0.55)"
              : glow === "red"
                ? "0 0 0 4px oklch(0.6 0.2 27), 0 0 36px 4px rgba(196,90,70,0.5)"
                : "0 0 0 1.5px rgba(196,160,92,0.55)",
          scale: glow === "green" ? 1.04 : 1,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative flex h-60 w-44 items-center justify-center rounded-3xl bg-gradient-to-b from-[#FFFFF8] to-[#F8F0E2] sm:h-64 sm:w-48"
      >
        {/* Status pill that flips with ownership */}
        <AnimatePresence mode="wait">
          {statusLabel && (
            <motion.span
              key={statusLabel + glow}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                "absolute top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                glow === "green"
                  ? "bg-[rgba(110,140,95,0.16)] text-[#4A5A42]"
                  : "bg-[rgba(196,90,70,0.14)] text-[#9A4A3C]",
              )}
            >
              {statusLabel}
            </motion.span>
          )}
        </AnimatePresence>

        <svg viewBox="0 0 100 140" className="h-44 w-auto text-muted-foreground/35" aria-hidden="true">
          <circle cx="50" cy="26" r="16" fill="currentColor" />
          <path
            d="M50 44c-18 0-30 12-30 30v40c0 4 3 7 7 7h46c4 0 7-3 7-7V74c0-18-12-30-30-30z"
            fill="currentColor"
          />
        </svg>

        <AnimatePresence mode="popLayout">
          {item ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.5, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={cn(
                "absolute top-[76px] flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl bg-[#FFFFF8] shadow-md",
                goldBorder,
              )}
            >
              <GarmentImage item={item} imgClassName="p-1" />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-[80px] flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground"
            >
              <Shirt className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span className="text-[13px] font-semibold uppercase tracking-wider text-foreground/80">{label}</span>
      {item && <span className="max-w-[130px] truncate text-center text-xs text-muted-foreground">{item.name}</span>}
    </div>
  )
}

export function TradeTab({ readyItems, onTradeComplete, onRequestAuth }: TradeTabProps) {
  const [query, setQuery] = useState("")
  const [match, setMatch] = useState<TradeMatch | null>(null)
  const [owner, setOwner] = useState<Owner>("match")
  const [flash, setFlash] = useState(false)
  const [insight, setInsight] = useState<TradeInsightResult | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const findMatch = async () => {
    if (!query.trim()) {
      toast.error("Describe or name the piece you're looking for.")
      return
    }

    if (readyItems.length === 0) {
      toast.error("Add items to Ready to Part With first — others need something to swap.")
      return
    }

    const result = findTradeMatch(query, readyItems)
    if (!result) {
      toast.error("No match in community listings yet. Try a broader description.")
      setMatch(null)
      setInsight(null)
      return
    }

    if (!result.offering) {
      toast.error("Move a piece to Ready to Part With so you can offer a fair swap.")
      return
    }

    setMatch(result)
    setOwner("match")
    setInsight(null)
    toast.success(`Matched with ${result.listing.userName} in ${result.listing.location} — "${result.listing.item.name}"`)

    // Fetch AI trade insight in the background
    setInsightLoading(true)
    try {
      const ai = await apiTradeInsight({
        wanted_item:  { name: result.listing.item.name,  category: result.listing.item.category, brand: result.listing.item.brand, tag: result.listing.item.tag },
        offered_item: { name: result.offering.name, category: result.offering.category, brand: result.offering.brand, wears: result.offering.wears, tag: result.offering.tag },
      })
      setInsight(ai)
    } catch (err) {
      const msg = (err as Error).message
      if (msg === "SESSION_EXPIRED") { onRequestAuth?.() }
    } finally {
      setInsightLoading(false)
    }
  }

  const handleTrade = async () => {
    if (!match?.offering) return
    const completed = match
    setFlash(true)
    // Flip ownership immediately so the borders visibly switch:
    // your match's green → red, and your green ← the piece you wanted.
    setOwner("you")
    await executeTrade(completed.offering!.id, completed.listing.userId)
    // Hold the swapped state long enough for the colour switch to be seen.
    setTimeout(() => {
      setFlash(false)
      onTradeComplete(completed.offering!.id, completed.listing.item)
      toast.success(`Trade complete — "${completed.listing.item.name}" is now yours! +5 Aware Score`)
      setMatch(null)
      setQuery("")
      setOwner("match")
    }, 1500)
  }

  const youItem = match ? (owner === "you" ? match.listing.item : match.offering) : null
  const matchItem = match ? (owner === "match" ? match.listing.item : match.offering) : null

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-balance font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          Trade
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Match with community members from their ready-to-part-with collections.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findMatch()}
              placeholder="What do you want? e.g. Vintage Denim Jacket"
              className="pl-9"
            />
          </div>
          <Button onClick={findMatch} className="rounded-full shrink-0 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Find Match
          </Button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            <Upload className="h-3.5 w-3.5" /> Photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            <Camera className="h-3.5 w-3.5" /> Camera
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={() => {
              toast.message("Photo search", {
                description: "Describe the piece in the search field — visual matching comes with the backend.",
              })
            }}
          />
        </div>
      </div>

      {readyItems.length === 0 && (
        <p className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-center text-xs text-muted-foreground">
          Drag items to <span className="font-medium text-foreground">Ready to part with</span> in your wardrobe
          before trading.
        </p>
      )}

      <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-10">
        <div className="flex items-center justify-center gap-4 sm:gap-10">
          <AvatarFigure
            label="You"
            glow={match ? (owner === "you" ? "green" : "red") : "none"}
            item={youItem}
            statusLabel={match ? (owner === "you" ? "Receiving" : "Giving") : undefined}
          />

          <div className="flex flex-col items-center gap-3">
            <motion.div animate={flash ? { rotate: [0, 180, 360] } : {}} transition={{ duration: 0.5 }}>
              <Button
                onClick={handleTrade}
                disabled={!match || owner === "you"}
                size="lg"
                className="rounded-full"
              >
                <ArrowLeftRight className="h-4 w-4" /> Trade
              </Button>
            </motion.div>
            {match && (
              <span className="max-w-[120px] text-center text-[10px] text-muted-foreground">
                via {match.listing.userName}
              </span>
            )}
          </div>

          <AvatarFigure
            label="Your Match"
            glow={match ? (owner === "match" ? "green" : "red") : "none"}
            item={matchItem}
            statusLabel={match ? (owner === "match" ? "Has it" : "Received") : undefined}
          />
        </div>

        {match && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            {owner === "match" ? (
              <>
                <span className="font-medium text-primary">Your Match</span> has{" "}
                <span className="text-foreground">{match.listing.item.name}</span> ·{" "}
                <span className="font-medium text-destructive">You</span> offer{" "}
                <span className="text-foreground">{match.offering?.name}</span>
              </>
            ) : (
              <span className="font-medium text-primary">Ownership transferred — swap complete</span>
            )}
          </motion.p>
        )}
      </div>

      {/* AI Trade Insight card */}
      <AnimatePresence mode="wait">
        {insightLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-6 py-4 text-sm text-muted-foreground"
          >
            <Bot className="h-4 w-4 animate-pulse text-primary" />
            AI is evaluating this swap…
          </motion.div>
        )}
        {!insightLoading && insight && (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "rounded-2xl border p-5 space-y-3",
              insight.verdict === "great" || insight.verdict === "good"
                ? "border-[rgba(122,140,110,0.35)] bg-[rgba(122,140,110,0.08)]"
                : insight.verdict === "caution"
                ? "border-[rgba(196,150,90,0.35)] bg-[rgba(196,150,90,0.08)]"
                : "border-border bg-card/60",
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{insight.emoji}</span>
              <div>
                <p className="font-medium text-foreground">{insight.headline}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Bot className="h-3 w-3" /> AI Trade Advisor · Score impact:
                  <span className={cn(
                    "font-semibold",
                    insight.score_impact.startsWith("+") ? "text-primary" : "text-muted-foreground"
                  )}>
                    {insight.score_impact}
                  </span>
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Why swap?</p>
                <p className="text-xs text-foreground">{insight.rationale}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Leaf className="h-3 w-3" /> Sustainability
                </p>
                <p className="text-xs text-foreground">{insight.sustainability}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Style tip</p>
                <p className="text-xs text-foreground">{insight.style_tip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {readyItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground">Your ready-to-part-with tray</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {readyItems.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex h-24 items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] p-2">
                  <GarmentImage item={item} />
                </div>
                <div className="px-2 py-2">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
