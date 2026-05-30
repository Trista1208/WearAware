"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeftRight, Search, Shirt } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { executeTrade } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarketplaceTabProps {
  listedItems: WardrobeItem[]
}

type Owner = "you" | "match"

/** Minimalist vector human silhouette with an optional clothing overlay. */
function Avatar({
  label,
  glow,
  hasItem,
}: {
  label: string
  glow: "green" | "red" | "none"
  hasItem: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        animate={{
          boxShadow:
            glow === "green"
              ? "0 0 0 3px var(--primary), 0 0 28px 2px color-mix(in oklch, var(--primary) 55%, transparent)"
              : glow === "red"
                ? "0 0 0 3px var(--destructive), 0 0 28px 2px color-mix(in oklch, var(--destructive) 55%, transparent)"
                : "0 0 0 1px var(--border)",
        }}
        transition={{ duration: 0.4 }}
        className="relative flex h-56 w-40 items-center justify-center rounded-3xl bg-card"
      >
        <svg viewBox="0 0 100 140" className="h-44 w-auto text-muted-foreground/40" aria-hidden="true">
          <circle cx="50" cy="26" r="16" fill="currentColor" />
          <path
            d="M50 44c-18 0-30 12-30 30v40c0 4 3 7 7 7h46c4 0 7-3 7-7V74c0-18-12-30-30-30z"
            fill="currentColor"
          />
        </svg>

        <AnimatePresence>
          {hasItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute top-[72px] flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-md"
            >
              <Shirt className="h-7 w-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

export function MarketplaceTab({ listedItems }: MarketplaceTabProps) {
  const [query, setQuery] = useState("")
  const [matchItem, setMatchItem] = useState<string | null>(null)
  // Who currently owns the matched item — drives the glowing border colors.
  const [owner, setOwner] = useState<Owner>("match")
  const [flash, setFlash] = useState(false)

  const findMatch = () => {
    if (!query.trim()) {
      toast.error("Enter an item to search for.")
      return
    }
    setMatchItem(query.trim())
    setOwner("match")
    toast.success(`Match found for "${query.trim()}"!`)
  }

  const handleTrade = async () => {
    if (!matchItem) return
    setFlash(true)
    // executeTrade(itemId, matchUserId) -> POST http://localhost:3000/api/wardrobe/trade
    await executeTrade(matchItem, "match-user-01")
    setTimeout(() => {
      setOwner("you")
      setFlash(false)
      toast.success(`Trade complete — "${matchItem}" is now yours!`)
    }, 500)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Marketplace
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Trade pieces peer-to-peer with the Instant Trade Matcher.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto flex w-full max-w-md items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findMatch()}
            placeholder="Request an item, e.g. Vintage Denim Jacket"
            className="pl-9"
          />
        </div>
        <Button onClick={findMatch} className="rounded-full">
          Find Match
        </Button>
      </div>

      {/* Avatars + trade */}
      <div className="rounded-3xl border border-border bg-card/60 p-6 sm:p-10">
        <div className="flex items-center justify-center gap-4 sm:gap-10">
          <Avatar
            label="You"
            glow={matchItem ? (owner === "you" ? "green" : "red") : "none"}
            hasItem={!!matchItem && owner === "you"}
          />

          <div className="flex flex-col items-center gap-3">
            <motion.div animate={flash ? { rotate: [0, 180, 360] } : {}} transition={{ duration: 0.5 }}>
              <Button
                onClick={handleTrade}
                disabled={!matchItem || owner === "you"}
                size="lg"
                className="rounded-full"
              >
                <ArrowLeftRight className="h-4 w-4" /> Trade
              </Button>
            </motion.div>
            {matchItem && (
              <span className="max-w-[120px] text-center text-xs text-muted-foreground">{matchItem}</span>
            )}
          </div>

          <Avatar
            label="Your Match"
            glow={matchItem ? (owner === "match" ? "green" : "red") : "none"}
            hasItem={!!matchItem && owner === "match"}
          />
        </div>

        {matchItem && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {owner === "match" ? (
              <>
                <span className="font-medium text-primary">Your Match</span> has it ·{" "}
                <span className="font-medium text-destructive">You</span> want it
              </>
            ) : (
              <span className="font-medium text-primary">Ownership transferred to you</span>
            )}
          </p>
        )}
      </div>

      {/* Your listings */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">Your active listings</h2>
        {listedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Nothing listed yet. List items from your Wardrobe or Daily Tracker.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listedItems.map((item) => (
              <div
                key={item.id}
                className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card")}
              >
                <div className="flex h-32 items-center justify-center bg-secondary p-3">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    crossOrigin="anonymous"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-card-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.brand}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
