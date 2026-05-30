"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Camera, MessageSquareText, Sparkles, ThumbsDown, ThumbsUp, Upload } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { apiAnalyzeGarment, apiGetPurchaseAdvice } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface BuyTabProps {
  items: WardrobeItem[]
  onScoreAdjust: (delta: number) => void
  onRequestAuth?: () => void
}

type InputMode = "describe" | "photo"

interface AIAdviceResult {
  verdict:      string
  headline:     string
  reason:       string
  scoreDelta:   number
  emoji:        string
  visual?:      string  // wardrobe similarity analysis from visual analyzer
}

export function BuyTab({ items, onScoreAdjust, onRequestAuth }: BuyTabProps) {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<InputMode>("describe")
  const [description, setDescription] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [advice, setAdvice] = useState<AIAdviceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState("Analyzing…")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const runAdvice = async (text: string) => {
    if (!user) {
      toast.error("Sign in to use the AI advisor.")
      onRequestAuth?.()
      return
    }
    if (!text.trim() && !preview) {
      toast.error("Describe or upload the piece you're considering.")
      return
    }
    setLoading(true)
    setAdvice(null)

    try {
      // Run visual analysis and purchase advice in parallel
      setLoadingMsg(preview ? "Analyzing image with AI…" : "Consulting AI stylist…")

      const [visualResult, purchaseResult] = await Promise.all([
        // Visual Analyzer — image takes priority, falls back to text
        preview
          ? apiAnalyzeGarment({ image_url: preview, include_wardrobe: true })
          : text.trim()
          ? apiAnalyzeGarment({ description: text.trim(), include_wardrobe: true })
          : Promise.resolve(null),

        // Purchase advice from sustainability engine
        apiGetPurchaseAdvice({
          item_description: text || "uploaded clothing item",
          is_second_hand: text.toLowerCase().includes("secondhand") || text.toLowerCase().includes("thrift") || text.toLowerCase().includes("vintage"),
          is_local_brand: text.toLowerCase().includes("local"),
        }),
      ])

      const delta = purchaseResult.estimated_score_delta ?? 0
      setAdvice({
        verdict:    purchaseResult.verdict,
        headline:   `${purchaseResult.emoji} ${purchaseResult.verdict === "buy" ? "Good addition" : purchaseResult.verdict === "skip" ? "Consider skipping" : "Think twice"}`,
        reason:     purchaseResult.advice,
        scoreDelta: delta,
        emoji:      purchaseResult.emoji,
        visual:     visualResult?.analysis ?? undefined,
      })
      onScoreAdjust(delta)

      if (purchaseResult.fast_fashion_warning) {
        toast.warning(purchaseResult.fast_fashion_warning)
      }
    } catch (err) {
      const msg = (err as Error).message
      if (msg === "SESSION_EXPIRED") {
        toast.error("Your session expired. Please sign in again.")
        onRequestAuth?.()
      } else {
        toast.error("AI advisor unavailable. Check your connection.")
        console.error("[buy-tab] AI error:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-balance font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          Should I buy?
        </h1>
        <p className="mt-2 max-w-md text-pretty text-sm text-muted-foreground">
          Get mindful advice before a purchase — based on your wardrobe and sustainability score.
        </p>
      </div>

      <motion.button
        type="button"
        onClick={() => user ? setVisible(true) : onRequestAuth?.()}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="rounded-3xl border border-border bg-card px-8 py-5 text-center shadow-[0_8px_32px_rgba(180,165,140,0.18)]"
      >
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
        <p className="font-medium text-foreground">Should I buy or should I not buy?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {user ? "Tap to open the AI purchase check" : "Sign in to use the AI advisor"}
        </p>
      </motion.button>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 180, damping: 24 }}
            className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lg"
          >
            <h2 className="text-center font-serif text-xl font-light text-foreground">
              Should I buy or should I not buy?
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("describe")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-colors",
                  mode === "describe"
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary",
                )}
              >
                <MessageSquareText className="h-5 w-5" />
                Describe it
              </button>
              <button
                type="button"
                onClick={() => setMode("photo")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-colors",
                  mode === "photo"
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary",
                )}
              >
                <Camera className="h-5 w-5" />
                Upload / capture
              </button>
            </div>

            <div className="mt-4">
              {mode === "describe" ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Vintage denim jacket from a local thrift shop"
                  className="min-h-[96px] resize-none rounded-2xl"
                />
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/60 transition-colors hover:border-primary/40"
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="h-full w-full object-contain p-4" />
                    ) : (
                      <>
                        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Tap to add a photo</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onloadend = () => setPreview(reader.result as string)
                      reader.readAsDataURL(file)
                    }}
                  />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional: describe the piece"
                    className="mt-3 min-h-[64px] resize-none rounded-2xl"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={() => runAdvice(description || "photo upload item")}
              disabled={loading}
              className="mt-4 w-full rounded-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Bot className="h-4 w-4 animate-pulse" />
                  {loadingMsg}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Get AI advice
                </span>
              )}
            </Button>

            <AnimatePresence mode="wait">
              {advice && (
                <motion.div
                  key={advice.headline}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 space-y-3"
                >
                  {/* Purchase verdict card */}
                  <div
                    className={cn(
                      "rounded-2xl border p-4",
                      advice.verdict === "buy"
                        ? "border-[rgba(122,140,110,0.35)] bg-[rgba(122,140,110,0.1)]"
                        : "border-[rgba(180,120,110,0.35)] bg-[rgba(180,120,110,0.1)]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {advice.verdict === "buy" ? (
                        <ThumbsUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <ThumbsDown className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{advice.headline}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{advice.reason}</p>
                        {advice.scoreDelta !== 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Estimated score impact:{" "}
                            <span
                              className={cn(
                                "font-medium",
                                advice.scoreDelta > 0 ? "text-primary" : "text-destructive",
                              )}
                            >
                              {advice.scoreDelta > 0 ? "+" : ""}
                              {advice.scoreDelta}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual analysis card (from the Sustainable Fashion Visual Analyzer) */}
                  {advice.visual && (
                    <details className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm">
                      <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground">
                        <Bot className="h-4 w-4 text-primary" />
                        Visual garment analysis
                      </summary>
                      <pre className="mt-3 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                        {advice.visual}
                      </pre>
                    </details>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
