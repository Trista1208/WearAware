"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Leaf, RefreshCw, Info, X } from "lucide-react"
import { fetchScore, computeScore, fetchBreakdown, type SustainabilityScore, type ScoreBreakdown } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function gradeColor(grade: string) {
  if (grade === "A+") return "text-emerald-500"
  if (grade === "A") return "text-green-500"
  if (grade === "B+") return "text-lime-500"
  if (grade === "B") return "text-yellow-500"
  if (grade === "C+") return "text-orange-400"
  if (grade === "C") return "text-orange-500"
  return "text-destructive"
}

function PenaltyRow({ label, value, desc }: { label: string; value: number; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/60 px-4 py-2.5">
      <span className="mt-0.5 text-xs font-mono font-semibold text-destructive w-12 shrink-0">
        {value > 0 ? `+${value}` : value}
      </span>
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

export function SustainabilityScoreBadge() {
  const { token } = useAuth()
  const [score, setScore] = useState<SustainabilityScore | null>(null)
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null)
  const [loading, setLoading] = useState(false)
  const [computing, setComputing] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const loadScore = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const s = await fetchScore()
    setScore(s)
    setLoading(false)
  }, [token])

  useEffect(() => {
    loadScore()
  }, [loadScore])

  const handleCompute = async () => {
    setComputing(true)
    const result = await computeScore()
    if (result) {
      setScore({ score: result.score, grade: result.grade, items_analysed: result.breakdown.items_analysed, updated_at: new Date().toISOString() })
      setBreakdown(result.breakdown)
    }
    setComputing(false)
  }

  const handleShowDetail = async () => {
    if (!breakdown) {
      setLoading(true)
      const b = await fetchBreakdown()
      if (b) setBreakdown(b)
      setLoading(false)
    }
    setShowDetail(true)
  }

  if (!token) return null

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Score pill */}
        <button
          onClick={handleShowDetail}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm transition hover:shadow-md"
        >
          <Leaf className="h-3.5 w-3.5 text-primary" />
          {loading ? (
            <span className="text-xs text-muted-foreground">…</span>
          ) : score ? (
            <>
              <span className="text-sm font-semibold text-foreground">{score.score}</span>
              <span className={cn("text-xs font-bold", gradeColor(score.grade))}>{score.grade}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No score</span>
          )}
        </button>

        {/* Recompute button */}
        <button
          onClick={handleCompute}
          disabled={computing}
          title="Recalculate sustainability score"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground hover:shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", computing && "animate-spin")} />
        </button>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm p-4 sm:items-center"
            onClick={(e) => e.target === e.currentTarget && setShowDetail(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Sustainability Breakdown</h2>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {breakdown ? (
                <div className="flex flex-col gap-4">
                  {/* Score summary */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-secondary p-3">
                      <p className="text-2xl font-bold text-foreground">{breakdown.base_score}</p>
                      <p className="text-[11px] text-muted-foreground">Base Score</p>
                    </div>
                    <div className="rounded-2xl bg-secondary p-3">
                      <p className={cn("text-2xl font-bold", gradeColor(breakdown.grade))}>{breakdown.final_score}</p>
                      <p className="text-[11px] text-muted-foreground">Final · {breakdown.grade}</p>
                    </div>
                    <div className="rounded-2xl bg-secondary p-3">
                      <p className="text-2xl font-bold text-foreground">{breakdown.items_analysed}</p>
                      <p className="text-[11px] text-muted-foreground">Items analysed</p>
                    </div>
                  </div>

                  {/* Penalty rows */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Penalties</p>
                    <PenaltyRow
                      label="Wardrobe Size"
                      value={-breakdown.penalties.wardrobe_size.penalty}
                      desc={breakdown.penalties.wardrobe_size.description}
                    />
                    <PenaltyRow
                      label="Fast Fashion"
                      value={-breakdown.penalties.fast_fashion.penalty}
                      desc={breakdown.penalties.fast_fashion.description}
                    />
                    <PenaltyRow
                      label="Similar Items"
                      value={-breakdown.penalties.similar_items.penalty}
                      desc={breakdown.penalties.similar_items.description}
                    />
                    <PenaltyRow
                      label="Low Utilisation"
                      value={-breakdown.penalties.low_utilisation.penalty}
                      desc={breakdown.penalties.low_utilisation.description}
                    />
                  </div>

                  {/* Bonus rows */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bonuses</p>
                    <PenaltyRow
                      label="High Wear Frequency"
                      value={breakdown.bonuses.high_wear.bonus}
                      desc={breakdown.bonuses.high_wear.description}
                    />
                  </div>

                  {/* Summary bullets */}
                  {breakdown.summary.length > 0 && (
                    <div className="rounded-2xl border border-border p-4">
                      <div className="mb-2 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What's affecting your score</p>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {breakdown.summary.map((s, i) => (
                          <li key={i} className="text-xs text-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => { handleCompute(); setShowDetail(false) }}
                    className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Recalculate Now
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {score
                      ? "Score loaded but breakdown unavailable yet."
                      : "No score computed yet — add items to your wardrobe first."}
                  </p>
                  <button
                    onClick={() => { handleCompute(); setShowDetail(false) }}
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    Compute My Score
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
