"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { type Category, type WardrobeItem } from "@/lib/wardrobe-data"
import {
  getItemsByCategory,
  getReadyToTradeItems,
} from "@/lib/wardrobe-selectors"
import { WardrobeCarousel } from "@/components/wardrobe-carousel"
import { AddItemPanel } from "@/components/add-item-panel"
import { ReadyToPartPanel } from "@/components/ready-to-part-panel"
import { AwareScoreRing } from "@/components/aware-score-ring"
import { GarmentDetailModal } from "@/components/garment-detail-modal"
import { WardrobeHomeScreen } from "@/components/wardrobe-home-screen"
import { cn } from "@/lib/utils"

interface WardrobeTabProps {
  items: WardrobeItem[]
  awareScore: number
  onAdd: (item: WardrobeItem) => void
  onMoveToReady: (id: string) => void
  onRemoveFromReady: (id: string) => void
}

export function WardrobeTab({
  items,
  awareScore,
  onAdd,
  onMoveToReady,
  onRemoveFromReady,
}: WardrobeTabProps) {
  const [selected, setSelected] = useState<Category | null>(null)
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null)

  const filtered = selected ? getItemsByCategory(items, selected) : []
  const readyItems = selected
    ? getReadyToTradeItems(items).filter((i) => i.category === selected)
    : getReadyToTradeItems(items)

  return (
    <section className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {selected === null ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <WardrobeHomeScreen
              items={items}
              awareScore={awareScore}
              onSelectCategory={setSelected}
            />
          </motion.div>
        ) : (
          <motion.div
            key="wardrobe-stage"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
            className="w-full"
          >
            <div className="mb-6 flex w-full items-center justify-between">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" /> Home
              </button>
              <h2 className={cn("font-serif text-lg font-light tracking-tight text-foreground")}>{selected}</h2>
              <div className="w-[110px]" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(200px,240px)_1fr_minmax(200px,240px)] lg:gap-6">
              <AddItemPanel category={selected} onAdd={onAdd} />

              <div className="relative flex flex-col items-center">
                <AwareScoreRing
                  score={awareScore}
                  className="absolute -right-2 -top-2 z-10 sm:-right-4 sm:-top-4"
                />
                <WardrobeCarousel
                  key={selected}
                  items={filtered}
                  onSelect={setDetailItem}
                  onMoveToReady={onMoveToReady}
                  onRemoveFromReady={onRemoveFromReady}
                />
              </div>

              <ReadyToPartPanel
                items={readyItems}
                onDrop={onMoveToReady}
                onRemove={onRemoveFromReady}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GarmentDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onMoveToReady={onMoveToReady}
        onRemoveFromReady={onRemoveFromReady}
      />
    </section>
  )
}
