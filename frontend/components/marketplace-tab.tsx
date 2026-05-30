"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeftRight, Search, Shirt, Loader2, Package, Plus, X } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import {
  addWantedItem,
  searchMatches,
  proposeMatch,
  fetchMyRtpw,
  addToRtpw,
  type RtpwItem,
  type MatchCandidate,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarketplaceTabProps {
  listedItems: WardrobeItem[]
}

type Owner = "you" | "match"

function Avatar({ label, glow, hasItem }: { label: string; glow: "green" | "red" | "none"; hasItem: boolean }) {
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
          <path d="M50 44c-18 0-30 12-30 30v40c0 4 3 7 7 7h46c4 0 7-3 7-7V74c0-18-12-30-30-30z" fill="currentColor" />
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
  const { token } = useAuth()

  // Search + matching state
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [wantedId, setWantedId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<MatchCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null)
  const [owner, setOwner] = useState<Owner>("match")
  const [flash, setFlash] = useState(false)
  const [proposing, setProposing] = useState(false)

  // Ready-to-part-with state
  const [rtpwItems, setRtpwItems] = useState<RtpwItem[]>([])
  const [rtpwLoading, setRtpwLoading] = useState(false)
  const [showRtpwAdd, setShowRtpwAdd] = useState(false)

  useEffect(() => {
    if (!token) return
    setRtpwLoading(true)
    fetchMyRtpw().then((items) => { setRtpwItems(items); setRtpwLoading(false) })
  }, [token])

  const findMatch = async () => {
    if (!query.trim()) { toast.error("Enter an item to search for."); return }
    if (!token) {
      // Offline / unauthenticated – just show mock match
      setSelectedCandidate({ rtpw_id: "mock", item_id: "mock", offering_user_id: "mock", category: "unknown", color: null, match_score: 80 })
      setOwner("match")
      toast.success(`Mock match found for "${query.trim()}"`)
      return
    }
    setSearching(true)
    setCandidates([])
    setSelectedCandidate(null)
    const wanted = await addWantedItem({ description: query.trim() })
    if (!wanted) { toast.error("Could not register wanted item."); setSearching(false); return }
    setWantedId(wanted.id)
    const matches = await searchMatches(wanted.id)
    setCandidates(matches)
    if (matches.length > 0) {
      setSelectedCandidate(matches[0])
      setOwner("match")
      toast.success(`${matches.length} match${matches.length > 1 ? "es" : ""} found!`)
    } else {
      toast("No matches yet — your request has been saved. You'll be notified when someone lists a match.")
    }
    setSearching(false)
  }

  const handleTrade = async () => {
    if (!selectedCandidate) return
    setFlash(true)
    setProposing(true)
    if (token) {
      await proposeMatch({ rtpw_id: selectedCandidate.rtpw_id, receiving_user_id: selectedCandidate.offering_user_id, match_score: selectedCandidate.match_score })
    }
    setTimeout(() => {
      setOwner("you")
      setFlash(false)
      setProposing(false)
      toast.success(`Trade request sent for "${query}"!`)
    }, 500)
  }

  const handleAddRtpw = async (itemId: string, itemName: string) => {
    if (!token) { toast.error("Sign in to add to Ready-to-Part-With"); return }
    const ok = await addToRtpw(itemId)
    if (ok) {
      toast.success(`${itemName} added to your Ready-to-Part-With list.`)
      const fresh = await fetchMyRtpw()
      setRtpwItems(fresh)
    } else {
      toast.error("Couldn't add item — maybe it's already there?")
    }
  }

  const matchItem = selectedCandidate?.item_id ?? null

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
        <Button onClick={findMatch} disabled={searching} className="rounded-full">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find Match"}
        </Button>
      </div>

      {/* Multiple candidates */}
      {candidates.length > 1 && (
        <div className="mx-auto w-full max-w-md">
          <p className="mb-2 text-xs text-muted-foreground">{candidates.length} matches found — select one:</p>
          <div className="flex flex-col gap-2">
            {candidates.map((c) => (
              <button
                key={c.rtpw_id}
                onClick={() => setSelectedCandidate(c)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-3 text-left text-sm transition",
                  selectedCandidate?.rtpw_id === c.rtpw_id ? "border-primary bg-accent" : "border-border bg-card hover:border-muted-foreground",
                )}
              >
                <span className="font-medium text-foreground">{c.category} {c.color ? `· ${c.color}` : ""}</span>
                <span className="text-xs text-muted-foreground">Match {c.match_score}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
                disabled={!matchItem || owner === "you" || proposing}
                size="lg"
                className="rounded-full"
              >
                {proposing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                Trade
              </Button>
            </motion.div>
            {matchItem && (
              <span className="max-w-[120px] text-center text-xs text-muted-foreground">{query || matchItem}</span>
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
              <span className="font-medium text-primary">Trade request sent ✓</span>
            )}
          </p>
        )}
      </div>

      {/* Ready-to-Part-With (backend) */}
      {token && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Ready to Part With (your listings)</h2>
            <button
              onClick={() => setShowRtpwAdd((v) => !v)}
              className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              {showRtpwAdd ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {showRtpwAdd ? "Cancel" : "Add item"}
            </button>
          </div>

          {/* Add from local wardrobe */}
          <AnimatePresence>
            {showRtpwAdd && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <p className="mb-2 text-xs text-muted-foreground">Pick a piece from your wardrobe to list:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {listedItems.concat(
                    [] // local listed items only for now
                  ).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4">
                      Mark items in your Wardrobe or Daily Tracker as "listed" first.
                    </p>
                  ) : (
                    listedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { handleAddRtpw(item.id, item.name); setShowRtpwAdd(false) }}
                        className="flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary"
                      >
                        <div className="flex h-24 items-center justify-center bg-secondary p-2">
                          <img src={item.image || "/placeholder.svg"} alt={item.name} crossOrigin="anonymous" className="h-full w-full object-contain" />
                        </div>
                        <span className="truncate px-2 py-1.5 text-xs font-medium">{item.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {rtpwLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rtpwItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-3 h-8 w-8 opacity-30" />
              Nothing ready to part with yet. Use the button above to list your first item.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {rtpwItems.map((item) => (
                <div key={item.id} className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card", item.is_matched && "opacity-60")}>
                  <div className="flex h-24 items-center justify-center bg-secondary p-3">
                    <Shirt className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-card-foreground">
                      {item.clothing_items?.name ?? "Item"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.is_matched ? "Matched ✓" : "Available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Fallback: local listings (unauthenticated) */}
      {!token && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground">Your active listings (local only)</h2>
          {listedItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Nothing listed yet. List items from your Wardrobe or Daily Tracker.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {listedItems.map((item) => (
                <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex h-32 items-center justify-center bg-secondary p-3">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} crossOrigin="anonymous" className="h-full w-full object-contain" />
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
      )}
    </div>
  )
}
