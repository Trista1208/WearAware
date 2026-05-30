"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shirt, ChevronLeft, Layers, ShoppingBag, Footprints, type LucideIcon } from "lucide-react"
import { categories, type Category, type WardrobeItem } from "@/lib/wardrobe-data"
import { fetchCategoryItems } from "@/lib/api"
import { WardrobeCarousel } from "@/components/wardrobe-carousel"
import { AddItemModal } from "@/components/add-item-modal"
import { cn } from "@/lib/utils"

const categoryIcons: Record<Category, LucideIcon> = {
  Tops: Layers,
  Shirts: Shirt,
  Jeans: Shirt,
  Shorts: Shirt,
  Shoes: Footprints,
  Accessories: ShoppingBag,
}

interface WardrobeTabProps {
  items: WardrobeItem[]
  onAdd: (item: WardrobeItem) => void
  onList: (id: string) => void
}

export function WardrobeTab({ items, onAdd, onList }: WardrobeTabProps) {
  const [selected, setSelected] = useState<Category | null>(null)

  const selectCategory = async (category: Category) => {
    setSelected(category)
    // fetchCategoryItems(category) -> GET /api/wardrobe/items?category={category}
    // Drives the 3D carousel from the backend; falls back to local state.
    await fetchCategoryItems(category)
  }

  const filtered = selected ? items.filter((i) => i.category === selected) : []

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
            <div className="mb-8 text-center">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Your Circular Wardrobe
              </h1>
              <p className="mt-2 text-pretty text-sm text-muted-foreground">
                Choose a category to revolve through your pieces.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {categories.map((category) => {
                const Icon = categoryIcons[category]
                const count = items.filter((i) => i.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => selectCategory(category)}
                    className="group flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-base font-medium text-card-foreground">{category}</span>
                      <span className="block text-xs text-muted-foreground">
                        {count} {count === 1 ? "piece" : "pieces"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <AddItemModal onAdd={onAdd} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="carousel"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex w-full flex-col items-center"
          >
            <div className="mb-6 flex w-full items-center justify-between">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" /> Categories
              </button>
              <h2 className={cn("text-lg font-semibold tracking-tight text-foreground")}>{selected}</h2>
              <div className="w-[110px]" />
            </div>

            <WardrobeCarousel items={filtered} onList={onList} />

            <div className="mt-8">
              <AddItemModal onAdd={onAdd} defaultCategory={selected} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
