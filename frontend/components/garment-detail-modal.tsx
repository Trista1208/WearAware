"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeftRight, HeartHandshake, X } from "lucide-react"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { getUsageFilter } from "@/lib/sustainability"
import { GarmentImage } from "@/components/garment-image"
import { cn } from "@/lib/utils"

interface GarmentDetailModalProps {
  item: WardrobeItem | null
  onClose: () => void
  onMoveToReady?: (id: string) => void
  onRemoveFromReady?: (id: string) => void
}

export function GarmentDetailModal({ item, onClose, onMoveToReady, onRemoveFromReady }: GarmentDetailModalProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.button
            type="button"
            aria-label="Close details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[rgba(44,44,44,0.28)] backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="garment-detail-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_64px_rgba(180,165,140,0.28)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] p-8">
              <GarmentImage
                item={item}
                imgClassName="max-h-full max-w-full transition-[filter] duration-500"
                style={{ filter: getUsageFilter(item.wears) }}
              />
            </div>

            <div className="space-y-3 p-6">
              <div>
                <p id="garment-detail-title" className="text-xl font-medium text-foreground">
                  {item.name}
                </p>
                <p className="text-sm text-muted-foreground">{item.brand}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {item.tag}
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {item.category}
                </span>
                {item.status === "readyToTrade" && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Ready to part with
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-secondary/80 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Worn</p>
                  <p className="text-lg font-medium text-foreground">{item.wears}×</p>
                </div>
                <div className="rounded-2xl bg-secondary/80 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Usage</p>
                  <p
                    className={cn(
                      "text-lg font-medium",
                      item.wears >= 20
                        ? "text-primary"
                        : item.wears <= 2
                          ? "text-destructive/80"
                          : "text-foreground",
                    )}
                  >
                    {item.wears >= 20 ? "High" : item.wears <= 2 ? "Low" : "Moderate"}
                  </p>
                </div>
              </div>

              {/* Trade action button */}
              {item.status === "wardrobe" && onMoveToReady && (
                <button
                  type="button"
                  onClick={() => { onMoveToReady(item.id); onClose() }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(201,169,106,0.4)] bg-gradient-to-b from-[rgba(248,228,210,0.5)] to-[rgba(235,195,165,0.35)] px-4 py-3 text-sm font-medium text-[#7A5A40] transition hover:from-[rgba(248,228,210,0.7)] hover:to-[rgba(235,195,165,0.55)]"
                >
                  <HeartHandshake className="h-4 w-4" />
                  List for community trade
                </button>
              )}
              {item.status === "readyToTrade" && onRemoveFromReady && (
                <button
                  type="button"
                  onClick={() => { onRemoveFromReady(item.id); onClose() }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Remove from trade listing
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
