"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HeartHandshake } from "lucide-react"
import type { WardrobeItem } from "@/lib/wardrobe-data"
import { getUsageFilter } from "@/lib/sustainability"
import { GarmentImage } from "@/components/garment-image"
import { cn } from "@/lib/utils"
import { goldBorder } from "@/lib/design-tokens"

interface ReadyToPartPanelProps {
  items: WardrobeItem[]
  onDrop: (id: string) => void
  onRemove: (id: string) => void
}

export function ReadyToPartPanel({ items, onDrop, onRemove }: ReadyToPartPanelProps) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 24 }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const id = e.dataTransfer.getData("text/wearaware-item-id")
        if (id) onDrop(id)
      }}
      className={cn(
        "flex h-full min-h-[420px] flex-col rounded-2xl p-6 shadow-sm transition-colors",
        goldBorder,
        dragOver
          ? "bg-[rgba(235,195,165,0.28)]"
          : "bg-[rgba(248,228,210,0.35)]",
      )}
    >
      <div className="mb-4 flex items-start gap-2">
        <HeartHandshake className="mt-0.5 h-4 w-4 text-[rgba(140,90,80,0.85)]" />
        <div>
          <h3 className="text-sm font-medium text-foreground">Ready to part with</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag pieces here to list for community trade.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(201,169,106,0.45)] px-4 py-8 text-center"
            >
              <p className="text-xs text-muted-foreground">
                Drop underused items from the wardrobe cylinder
              </p>
            </motion.div>
          ) : (
            items.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onRemove(item.id)}
                className={cn("group flex items-center gap-3 rounded-2xl bg-[#FFFFF8] p-3 text-left shadow-sm transition-shadow hover:shadow-md", goldBorder)}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3]">
                  <GarmentImage
                    item={item}
                    imgClassName="p-1"
                    style={{ filter: getUsageFilter(item.wears) }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.brand}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground group-hover:text-primary">
                    Tap to return to wardrobe
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}
