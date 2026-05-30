"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, MessageSquareText, Sparkles, ThumbsDown, ThumbsUp, Upload } from "lucide-react"
import { toast } from "sonner"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { getBuyAdvice, type BuyAdvice } from "@/lib/sustainability"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface BuyTabProps {
  items: WardrobeItem[]
  onScoreAdjust: (delta: number) => void
}

type InputMode = "describe" | "photo"

export function BuyTab({ items, onScoreAdjust }: BuyTabProps) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<InputMode>("describe")
  const [description, setDescription] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [advice, setAdvice] = useState<BuyAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const runAdvice = async (text: string) => {
    if (!text.trim() && !preview) {
      toast.error("Describe or upload the piece you're considering.")
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    const result = getBuyAdvice(text || "new clothing item", items)
    setAdvice(result)
    onScoreAdjust(result.scoreDelta)
    setLoading(false)
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
        onClick={() => setVisible(true)}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="rounded-3xl border border-border bg-card px-8 py-5 text-center shadow-[0_8px_32px_rgba(180,165,140,0.18)]"
      >
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
        <p className="font-medium text-foreground">Should I buy or should I not buy?</p>
        <p className="mt-1 text-xs text-muted-foreground">Tap to open the purchase check</p>
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
              {loading ? "Analyzing wardrobe…" : "Get advice"}
            </Button>

            <AnimatePresence mode="wait">
              {advice && (
                <motion.div
                  key={advice.headline}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "mt-6 rounded-2xl border p-4",
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
