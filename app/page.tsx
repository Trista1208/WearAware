"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Shirt, CalendarCheck, HelpCircle, ArrowLeftRight, Store, Sprout, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { champagneBorder, PAGE_BG } from "@/lib/design-tokens"

// Warm grain-gradient frame — client only (WebGL shader)
const GradientBackground = dynamic(
  () => import("@/components/ui/paper-design-shader-background").then((m) => m.GradientBackground),
  { ssr: false, loading: () => <div className="fixed inset-0 -z-10" style={{ backgroundColor: PAGE_BG }} /> },
)
import { initialItems, type WardrobeItem } from "@/lib/wardrobe-data"
import { computeAwareScore } from "@/lib/sustainability"
import {
  getReadyToTradeItems,
  getWardrobeItems,
  withStatus,
} from "@/lib/wardrobe-selectors"
import { WardrobeTab } from "@/components/wardrobe-tab"
import { DailyTrackerTab } from "@/components/daily-tracker-tab"
import { BuyTab } from "@/components/buy-tab"
import { TradeTab } from "@/components/trade-tab"
import { StoresTab } from "@/components/stores-tab"

type Tab = "wardrobe" | "tracker" | "buy" | "trade" | "stores"

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "wardrobe", label: "Wardrobe", icon: Shirt },
  { id: "tracker", label: "Daily Tracker", icon: CalendarCheck },
  { id: "buy", label: "Buy?", icon: HelpCircle },
  { id: "trade", label: "Trade", icon: ArrowLeftRight },
  { id: "stores", label: "Stores", icon: Store },
]

export default function Page() {
  const [tab, setTab] = useState<Tab>("wardrobe")
  const [items, setItems] = useState<WardrobeItem[]>(initialItems)
  const [tradeBonus, setTradeBonus] = useState(0)
  const [scoreAdjustments, setScoreAdjustments] = useState(0)

  const wardrobeItems = useMemo(() => getWardrobeItems(items), [items])
  const readyItems = useMemo(() => getReadyToTradeItems(items), [items])
  const trackerItems = useMemo(() => items.filter((i) => i.status !== "traded"), [items])

  const awareScore = useMemo(() => {
    const base = computeAwareScore(wardrobeItems, tradeBonus)
    return Math.min(100, Math.max(0, base.total + scoreAdjustments))
  }, [wardrobeItems, tradeBonus, scoreAdjustments])

  const addItem = (item: WardrobeItem) =>
    setItems((prev) => [withStatus({ ...item, image: item.imageUrl }, "wardrobe"), ...prev])

  const moveToReady = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? withStatus(i, "readyToTrade") : i)),
    )
    const item = items.find((i) => i.id === id)
    if (item && item.status === "wardrobe") {
      toast.success(`${item.name} moved to Ready to Part With.`)
    }
  }

  const logWear = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, wears: i.wears + 1 } : i)))

  const removeFromReady = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? withStatus(i, "wardrobe") : i)))
  }

  const handleTradeComplete = (offeringId: string | null, gainedItem: WardrobeItem) => {
    setItems((prev) => {
      const withoutOffering = offeringId
        ? prev.map((i) => (i.id === offeringId ? withStatus(i, "traded") : i)).filter((i) => i.status !== "traded")
        : prev
      return [
        withStatus(
          {
            ...gainedItem,
            id: crypto.randomUUID(),
            imageUrl: gainedItem.imageUrl || gainedItem.image || "",
            wears: 0,
          },
          "wardrobe",
        ),
        ...withoutOffering,
      ]
    })
    setTradeBonus((b) => Math.min(15, b + 5))
  }

  const handleScoreAdjust = (delta: number) => {
    setScoreAdjustments((s) => s + delta)
  }

  return (
    <main className="relative min-h-dvh pb-32">
      <GradientBackground />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-9 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#FFFFF8] to-[#F6EEE0]",
              champagneBorder,
            )}
          >
            <Sprout className="h-4 w-4 text-primary" />
          </div>
          <span className="font-serif text-[22px] font-medium tracking-tight text-[#2C2C2C]">Wear Aware</span>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-medium text-foreground">
            {wardrobeItems.length} pieces
          </p>
          <p className="text-[12px] tracking-wide text-muted-foreground">Score {awareScore}</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-12 sm:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
          >
            {tab === "wardrobe" && (
              <WardrobeTab
                items={items}
                awareScore={awareScore}
                onAdd={addItem}
                onMoveToReady={moveToReady}
                onRemoveFromReady={removeFromReady}
              />
            )}
            {tab === "tracker" && (
              <DailyTrackerTab items={trackerItems} onWear={logWear} onList={moveToReady} />
            )}
            {tab === "buy" && (
              <BuyTab items={wardrobeItems} onScoreAdjust={handleScoreAdjust} />
            )}
            {tab === "trade" && (
              <TradeTab readyItems={readyItems} onTradeComplete={handleTradeComplete} />
            )}
            {tab === "stores" && <StoresTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div
          className={cn(
            "flex items-center gap-0.5 rounded-full p-1 backdrop-blur-sm",
            champagneBorder,
            "bg-gradient-to-b from-[#FFFFF8]/96 to-[#F8F1E5]/94 shadow-[0_12px_40px_rgba(201,169,106,0.2),0_2px_8px_rgba(180,120,90,0.08)]",
          )}
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[13px] font-medium transition-colors sm:gap-2 sm:px-4",
                  isActive ? "text-[#FFFFF8]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-b from-[#6A7A60] to-[#54634C] shadow-[0_3px_12px_rgba(94,110,85,0.36),inset_0_1px_0_rgba(232,214,170,0.5)] ring-1 ring-[rgba(212,180,118,0.5)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className={cn("relative z-10 tracking-wide", !isActive && "hidden sm:inline")}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </main>
  )
}
