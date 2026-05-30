"use client"

import { useEffect, useState } from "react"
import { Building2, MapPin, Globe, Mail, Loader2, RefreshCw, Leaf } from "lucide-react"
import { fetchStores, type PartnerStore } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const MOCK_STORES: PartnerStore[] = [
  { id: "s1", name: "The Green Rack",   description: "Curated secondhand fashion in the city centre.", city: "Amsterdam", country: "NL", commission_pct: 15, contact_email: "hello@greenrack.nl",   website_url: "https://greenrack.nl" },
  { id: "s2", name: "Re-Loved Co.",     description: "Pre-loved garments with authenticated quality checks.", city: "Berlin", country: "DE", commission_pct: 12, contact_email: "info@reloved.co",     website_url: "https://reloved.co" },
  { id: "s3", name: "Threads Again",    description: "Community-run charity shop with a sustainable mission.", city: "London", country: "GB", commission_pct: 10, contact_email: null,                  website_url: null },
  { id: "s4", name: "Circular Closet",  description: "Zero-waste boutique with free drop-off service.",       city: "Paris",  country: "FR", commission_pct: 18, contact_email: "drop@circular.fr",    website_url: "https://circular.fr" },
]

function CommissionBadge({ pct }: { pct: number }) {
  const color =
    pct <= 12 ? "bg-green-100 text-green-700" :
    pct <= 16 ? "bg-yellow-100 text-yellow-700" :
                "bg-orange-100 text-orange-700"
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", color)}>
      {pct}% commission
    </span>
  )
}

export function StoresTab() {
  const { token } = useAuth()
  const [stores, setStores] = useState<PartnerStore[]>([])
  const [loading, setLoading] = useState(false)
  const [city, setCity] = useState("")
  const [cityFilter, setCityFilter] = useState("")

  const load = async (c?: string) => {
    setLoading(true)
    const data = await fetchStores(c || undefined)
    setStores(data.length > 0 ? data : MOCK_STORES)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  const displayed = cityFilter
    ? stores.filter((s) => s.city.toLowerCase().includes(cityFilter.toLowerCase()))
    : stores

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Partner Stores
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Donate your listed items to local second-hand stores and earn sustainability points.
        </p>
      </div>

      {/* How it works */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { step: "1", title: "List an item", desc: "Mark any wardrobe piece as 'ready to part with'." },
          { step: "2", title: "Choose a store",desc: "Pick a nearby partner store from the list below." },
          { step: "3", title: "Earn points",   desc: "When the item sells, you get a sustainability score boost." },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex items-start gap-4 rounded-3xl border border-border bg-card p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {step}
            </span>
            <div>
              <p className="text-sm font-medium text-card-foreground">{title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* City filter */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setCityFilter(city); load(city) }
            }}
            placeholder="Filter by city…"
            className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => { setCityFilter(city); load(city) }}
          disabled={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Store list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No stores found{cityFilter ? ` in "${cityFilter}"` : ""}.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((store) => (
            <div
              key={store.id}
              className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-card-foreground">{store.name}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {store.city}, {store.country}
                    </div>
                  </div>
                </div>
                <CommissionBadge pct={store.commission_pct} />
              </div>

              {store.description && (
                <p className="text-sm text-muted-foreground">{store.description}</p>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {store.website_url && (
                  <a
                    href={store.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <Globe className="h-3.5 w-3.5" /> Website
                  </a>
                )}
                {store.contact_email && (
                  <a
                    href={`mailto:${store.contact_email}`}
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" /> Contact
                  </a>
                )}
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                  <Leaf className="h-3.5 w-3.5 text-primary" />
                  Earns sustainability points
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
