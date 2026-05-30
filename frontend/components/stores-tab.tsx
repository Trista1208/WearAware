"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Building2, MapPin, Globe, Mail, Loader2, RefreshCw, Leaf } from "lucide-react"
import { fetchStores, type PartnerStore } from "@/lib/api"
import { cn } from "@/lib/utils"
import { goldBorder, goldBorderSoft } from "@/lib/design-tokens"

const MOCK_STORES: PartnerStore[] = [
  { id: "s1", name: "The Green Rack",   description: "Curated secondhand fashion in the city centre.", city: "Amsterdam", country: "NL", commission_pct: 15, contact_email: "hello@greenrack.nl",   website_url: "https://greenrack.nl" },
  { id: "s2", name: "Re-Loved Co.",     description: "Pre-loved garments with authenticated quality checks.", city: "Berlin", country: "DE", commission_pct: 12, contact_email: "info@reloved.co",     website_url: "https://reloved.co" },
  { id: "s3", name: "Threads Again",    description: "Community-run charity shop with a sustainable mission.", city: "London", country: "GB", commission_pct: 10, contact_email: null,                  website_url: null },
  { id: "s4", name: "Circular Closet",  description: "Zero-waste boutique with free drop-off service.",       city: "Paris",  country: "FR", commission_pct: 18, contact_email: "drop@circular.fr",    website_url: "https://circular.fr" },
]

function CommissionBadge({ pct }: { pct: number }) {
  const color =
    pct <= 12 ? "bg-[rgba(122,140,110,0.16)] text-[#4A5A42]" :
    pct <= 16 ? "bg-[rgba(196,168,108,0.18)] text-[#8A7340]" :
                "bg-[rgba(196,120,80,0.16)] text-[#A0583C]"
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", color)}>
      {pct}% commission
    </span>
  )
}

export function StoresTab() {
  // Seed with the mock directory so there's no setState-on-mount; a real backend
  // refresh still happens when the user filters by city.
  const [stores, setStores] = useState<PartnerStore[]>(MOCK_STORES)
  const [loading, setLoading] = useState(false)
  const [city, setCity] = useState("")
  const [cityFilter, setCityFilter] = useState("")

  const load = async (c?: string) => {
    setLoading(true)
    const data = await fetchStores(c || undefined)
    setStores(data.length > 0 ? data : MOCK_STORES)
    setLoading(false)
  }

  const displayed = cityFilter
    ? stores.filter((s) => s.city.toLowerCase().includes(cityFilter.toLowerCase()))
    : stores

  const cardClass = cn(
    "rounded-3xl p-6",
    goldBorder,
    "bg-gradient-to-br from-[#FFFCF7]/92 to-[#FBF3E6]/85 shadow-[inset_0_1px_0_rgba(255,255,248,1),0_8px_28px_rgba(201,169,106,0.1)]",
  )

  return (
    <div className="flex flex-col gap-9">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-balance font-serif text-4xl font-light tracking-tight text-[#2C2C2C] sm:text-[2.875rem]"
        >
          Partner Stores
        </motion.h1>
        <p className="mt-2.5 text-pretty text-[14px] text-muted-foreground">
          Donate your listed items to local second-hand stores and earn sustainability points.
        </p>
      </div>

      {/* How it works */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { step: "1", title: "List an item", desc: "Mark any wardrobe piece as 'ready to part with'." },
          { step: "2", title: "Choose a store", desc: "Pick a nearby partner store from the list below." },
          { step: "3", title: "Earn points", desc: "When the item sells, you get a sustainability score boost." },
        ].map(({ step, title, desc }) => (
          <div key={step} className={cn("flex items-start gap-4 p-5", cardClass)}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#6A7A60] to-[#54634C] text-sm font-bold text-[#FFFFF8] ring-1 ring-[rgba(212,180,118,0.45)]">
              {step}
            </span>
            <div>
              <p className="text-[14px] font-medium text-card-foreground">{title}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* City filter */}
      <div className="mx-auto flex w-full max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setCityFilter(city)
                load(city)
              }
            }}
            placeholder="Filter by city…"
            className={cn(
              "w-full rounded-full bg-[#FFFFF8] py-2.5 pl-10 pr-4 text-[14px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:shadow-[0_0_0_2px_rgba(94,110,85,0.35)]",
              goldBorder,
            )}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setCityFilter(city)
            load(city)
          }}
          disabled={loading}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFFFF8] text-muted-foreground transition hover:text-foreground disabled:opacity-50",
            goldBorder,
          )}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Store list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[rgba(201,169,106,0.5)] bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No stores found{cityFilter ? ` in "${cityFilter}"` : ""}.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, type: "spring", stiffness: 220, damping: 26 }}
              className={cn("flex flex-col gap-4 transition-shadow hover:shadow-[inset_0_1px_0_rgba(255,255,248,1),0_14px_36px_rgba(201,169,106,0.18)]", cardClass)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(122,140,110,0.14)] text-[#5E6E55]">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold text-card-foreground">{store.name}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {store.city}, {store.country}
                    </div>
                  </div>
                </div>
                <CommissionBadge pct={store.commission_pct} />
              </div>

              {store.description && <p className="text-[14px] text-muted-foreground">{store.description}</p>}

              <div className="flex flex-wrap items-center gap-3">
                {store.website_url && (
                  <a
                    href={store.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("flex items-center gap-1.5 rounded-full bg-[#FFFFF8] px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-secondary", goldBorderSoft)}
                  >
                    <Globe className="h-3.5 w-3.5" /> Website
                  </a>
                )}
                {store.contact_email && (
                  <a
                    href={`mailto:${store.contact_email}`}
                    className={cn("flex items-center gap-1.5 rounded-full bg-[#FFFFF8] px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-secondary", goldBorderSoft)}
                  >
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </a>
                )}
                <span className="ml-auto flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Leaf className="h-3.5 w-3.5 text-primary" />
                  Earns sustainability points
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
