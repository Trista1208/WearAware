"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shirt, CalendarCheck, TrendingUp, Store, Sprout, Building2, LogOut, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { initialItems, type WardrobeItem } from "@/lib/wardrobe-data"
import { WardrobeTab } from "@/components/wardrobe-tab"
import { DailyTrackerTab } from "@/components/daily-tracker-tab"
import { SavingsImpactTab } from "@/components/savings-impact-tab"
import { MarketplaceTab } from "@/components/marketplace-tab"
import { StoresTab } from "@/components/stores-tab"
import { AuthModal } from "@/components/auth-modal"
import { SustainabilityScoreBadge } from "@/components/sustainability-score-badge"
import { AuthProvider, useAuth } from "@/lib/auth-context"

type Tab = "wardrobe" | "tracker" | "impact" | "marketplace" | "stores"

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "wardrobe",     label: "Wardrobe",   icon: Shirt },
  { id: "tracker",     label: "Tracker",    icon: CalendarCheck },
  { id: "impact",      label: "Impact",     icon: TrendingUp },
  { id: "marketplace", label: "Marketplace",icon: Store },
  { id: "stores",      label: "Stores",     icon: Building2 },
]

function AppShell() {
  const { user, logout, isLoading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [tab, setTab] = useState<Tab>("wardrobe")
  const [items, setItems] = useState<WardrobeItem[]>(initialItems)

  const addItem = (item: WardrobeItem) => setItems((prev) => [item, ...prev])

  const listItem = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, listed: true } : i)))
    const item = items.find((i) => i.id === id)
    if (item && !item.listed) toast.success(`${item.name} listed on the Marketplace.`)
  }

  const wearItem = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, wears: i.wears + 1 } : i)))

  const listedItems = items.filter((i) => i.listed)

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <main className="relative min-h-dvh bg-background pb-32">
      {/* Auth modal */}
      {showAuth && <AuthModal onSuccess={() => setShowAuth(false)} />}

      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sprout className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">WearAware</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live sustainability score (only when logged in) */}
          <SustainabilityScoreBadge />

          {user ? (
            <button
              onClick={() => { logout(); toast.success("Signed out") }}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{user.email?.split("@")[0] ?? "Account"}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {tab === "wardrobe"     && <WardrobeTab items={items} onAdd={addItem} onList={listItem} />}
            {tab === "tracker"     && <DailyTrackerTab items={items} onWear={wearItem} onList={listItem} />}
            {tab === "impact"      && <SavingsImpactTab />}
            {tab === "marketplace" && <MarketplaceTab listedItems={listedItems} />}
            {tab === "stores"      && <StoresTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation dock */}
      <nav className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 p-1.5 shadow-lg backdrop-blur-md">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-medium transition-colors sm:px-3.5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10 hidden sm:inline">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </main>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
