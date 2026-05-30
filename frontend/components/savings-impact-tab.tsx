"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Bar, BarChart } from "recharts"
import { DollarSign, Droplets, Leaf, Shirt, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from "lucide-react"
import { savingsHistory } from "@/lib/wardrobe-data"
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

type Metric = "money" | "water" | "carbon"

const metricCards: {
  key: Metric
  label: string
  value: string
  caption: string
  icon: typeof DollarSign
}[] = [
  { key: "money",  label: "Money Saved",   value: "$428",     caption: "from prevented duplicate purchases", icon: DollarSign },
  { key: "water",  label: "Water Saved",   value: "10,400 L", caption: "by rewearing instead of buying",     icon: Droplets },
  { key: "carbon", label: "Carbon Offsets",value: "78 kg",    caption: "of CO₂ kept out of the air",        icon: Leaf },
]

const chartConfig: ChartConfig = {
  money:  { label: "Money ($)",   color: "var(--chart-1)" },
  water:  { label: "Water (L)",   color: "var(--chart-2)" },
  carbon: { label: "Carbon (kg)", color: "var(--chart-3)" },
  count:  { label: "Wears",       color: "var(--chart-1)" },
}

const severityIcon: Record<string, typeof CheckCircle> = {
  high:   AlertTriangle,
  medium: TrendingUp,
  low:    CheckCircle,
}
const severityColor: Record<string, string> = {
  high:   "text-destructive",
  medium: "text-orange-500",
  low:    "text-primary",
}

export function SavingsImpactTab() {
  const { token } = useAuth()
  const [metric, setMetric] = useState<Metric>("money")
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const loadAnalytics = async () => {
    if (!token) return
    setLoading(true)
    const data = await fetchAnalyticsSummary()
    if (data) setAnalytics(data)
    setLoading(false)
  }

  useEffect(() => {
    loadAnalytics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const wearTrend = analytics?.wardrobe.monthly_wear_trend ?? []
  const categoryBreakdown = analytics?.wardrobe.category_breakdown ?? []
  const insights = analytics?.insights ?? []

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Savings Impact
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
            The measurable upside of wearing what you already own.
          </p>
        </div>
        {token && (
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        )}
      </div>

      {/* Wardrobe stats (live) */}
      {analytics && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Shirt className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-card-foreground">Total Items</span>
            </div>
            <p className="text-3xl font-semibold text-card-foreground">{analytics.wardrobe.total_items}</p>
            <p className="text-xs text-muted-foreground mt-1">{analytics.wardrobe.never_worn_count} never worn ({analytics.wardrobe.never_worn_pct}%)</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <DollarSign className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-card-foreground">Wardrobe Value</span>
            </div>
            <p className="text-3xl font-semibold text-card-foreground">
              ${(analytics.wardrobe.total_wardrobe_value ?? 0).toLocaleString()}
            </p>
            {analytics.wardrobe.estimated_cost_per_wear != null && (
              <p className="text-xs text-muted-foreground mt-1">~${analytics.wardrobe.estimated_cost_per_wear} per wear</p>
            )}
          </div>
          {analytics.score && (
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Leaf className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-card-foreground">Sustainability</span>
              </div>
              <p className="text-3xl font-semibold text-card-foreground">{analytics.score.score}</p>
              <p className="text-xs text-muted-foreground mt-1">Grade {analytics.score.grade}</p>
            </div>
          )}
        </div>
      )}

      {/* Savings metric cards (static estimates) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon
          const isActive = metric === card.key
          return (
            <button
              key={card.key}
              onClick={() => setMetric(card.key)}
              className={cn(
                "flex flex-col gap-4 rounded-3xl border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                isActive ? "border-primary ring-2 ring-primary/30" : "border-border",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-card-foreground">{card.value}</p>
                <p className="text-sm font-medium text-card-foreground">{card.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.caption}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Monthly savings trend */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="mb-1 text-sm font-medium text-card-foreground">Savings — last 6 months (estimate)</h2>
        <p className="mb-4 text-xs text-muted-foreground">Tap a card above to switch the metric.</p>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart data={savingsHistory} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={44} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={`var(--color-${metric})`}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </div>

      {/* Live: monthly wear trend */}
      {wearTrend.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-1 text-sm font-medium text-card-foreground">Wear activity (live from wardrobe)</h2>
          <p className="mb-4 text-xs text-muted-foreground">Number of wear-logs recorded each month.</p>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={wearTrend} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* Live: category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-medium text-card-foreground">Your wardrobe by category</h2>
          <div className="flex flex-col gap-3">
            {categoryBreakdown.map(({ category, count }) => {
              const max = Math.max(...categoryBreakdown.map((c) => c.count))
              return (
                <div key={category} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{category}</span>
                  <div className="flex-1 rounded-full bg-secondary h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-foreground">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live: AI insights */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-foreground">Insights from your wardrobe</h2>
          {insights.map((ins, i) => {
            const Icon = severityIcon[ins.severity] ?? CheckCircle
            return (
              <div key={i} className="rounded-3xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", severityColor[ins.severity])} />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{ins.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{ins.action}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!token && (
        <div className="rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Sign in to load your live wardrobe analytics from the backend.
        </div>
      )}
    </div>
  )
}
