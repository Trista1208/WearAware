"use client"

import { useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { DollarSign, Droplets, Leaf } from "lucide-react"
import { savingsHistory } from "@/lib/wardrobe-data"
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
  { key: "money", label: "Money Saved", value: "$428", caption: "from prevented duplicate purchases", icon: DollarSign },
  { key: "water", label: "Water Saved", value: "10,400 L", caption: "by rewearing instead of buying", icon: Droplets },
  { key: "carbon", label: "Carbon Offsets", value: "78 kg", caption: "of CO₂ kept out of the air", icon: Leaf },
]

const chartConfig: ChartConfig = {
  money: { label: "Money ($)", color: "var(--chart-1)" },
  water: { label: "Water (L)", color: "var(--chart-2)" },
  carbon: { label: "Carbon (kg)", color: "var(--chart-3)" },
}

export function SavingsImpactTab() {
  const [metric, setMetric] = useState<Metric>("money")

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Savings Impact
        </h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          The measurable upside of wearing what you already own.
        </p>
      </div>

      {/* Metric cards */}
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

      {/* Trend chart */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="mb-1 text-sm font-medium text-card-foreground">Last 6 months</h2>
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
    </div>
  )
}
