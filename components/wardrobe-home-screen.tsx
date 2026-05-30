"use client"

import { motion } from "framer-motion"
import { categories, type Category, type WardrobeItem } from "@/lib/wardrobe-data"
import { getItemsByCategory } from "@/lib/wardrobe-selectors"
import { AwareScoreRing } from "@/components/aware-score-ring"
import { CategoryBreakdown } from "@/components/category-breakdown"
import { WarmShowroomBackground } from "@/components/warm-showroom-background"
import { GarmentImage } from "@/components/garment-image"
import { categoryColors, CategoryIcon } from "@/components/category-icons"
import { cn } from "@/lib/utils"
import { goldBorder, goldBorderSoft } from "@/lib/design-tokens"

interface WardrobeHomeScreenProps {
  items: WardrobeItem[]
  awareScore: number
  onSelectCategory: (category: Category) => void
}

function CategoryGarmentPreviews({
  previews,
  category,
}: {
  previews: WardrobeItem[]
  category: Category
}) {
  const shown = previews.slice(0, 4)

  if (shown.length === 0) {
    return (
      <div className={cn("flex h-[68px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#FAF4EC]/90 to-[#F2E6D4]/70", goldBorderSoft)}>
        <GarmentImage
          item={{ category, name: category, imageUrl: "" }}
          className="h-11 w-11 opacity-70"
        />
      </div>
    )
  }

  return (
    <div className="relative h-[68px] w-[88px] shrink-0">
      {shown.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + idx * 0.04 }}
          className={cn(
            "absolute bottom-0 overflow-hidden rounded-[10px] bg-gradient-to-b from-[#FFFFF8] to-[#FBF4E8]",
            goldBorderSoft,
            "shadow-[0_4px_12px_rgba(201,169,106,0.18)]",
          )}
          style={{
            width: 44,
            height: 56,
            right: idx * 14,
            zIndex: 4 - idx,
            transform: `rotate(${(idx - 1.5) * 4}deg)`,
          }}
        >
          <GarmentImage item={item} imgClassName="p-1" />
        </motion.div>
      ))}
    </div>
  )
}

export function WardrobeHomeScreen({ items, awareScore, onSelectCategory }: WardrobeHomeScreenProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px]",
        goldBorder,
        "bg-[#FFFCF7]/72",
        "shadow-[inset_0_1px_0_rgba(255,255,248,0.98),0_28px_72px_rgba(201,169,106,0.14)]",
      )}
    >
      <WarmShowroomBackground />

      <div className="relative z-10 p-6 sm:p-9">
        <div className="relative mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 26 }}
            className="absolute right-0 top-0 z-10 shrink-0"
          >
            <AwareScoreRing score={awareScore} size="hero" />
          </motion.div>

          <div className="mx-auto max-w-2xl pt-1 text-center sm:pt-2">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground"
            >
              Sustainable wardrobe
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 font-serif text-[3.5rem] font-light leading-[1.02] tracking-[-0.03em] text-[#2C2C2C] sm:text-[4.5rem]"
            >
              Wear Aware
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-3.5 max-w-sm text-pretty text-[14px] leading-relaxed text-muted-foreground"
            >
              Choose a category to explore your circular wardrobe.
            </motion.p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {categories.map((category, i) => {
            const categoryItems = getItemsByCategory(items, category)
            const count = categoryItems.length
            const colors = categoryColors[category]

            return (
              <motion.button
                key={category}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 + i * 0.035, type: "spring", stiffness: 260, damping: 28 }}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
                onClick={() => onSelectCategory(category)}
                className={cn(
                  "group relative flex w-full items-end justify-between gap-2 overflow-hidden rounded-2xl p-4 text-left sm:p-5",
                  goldBorder,
                  "bg-gradient-to-br from-[#FFFFF8]/95 to-[#FBF3E6]/88",
                  "shadow-[inset_0_1px_0_rgba(255,255,248,1),0_2px_10px_rgba(201,169,106,0.1)]",
                  "transition-shadow duration-500 hover:shadow-[inset_0_1px_0_rgba(255,255,248,1),0_16px_40px_rgba(201,169,106,0.2)]",
                )}
              >
                {/* Warm glow that blooms on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(245,205,160,0.55) 0%, transparent 70%)" }}
                />
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                        colors.bg,
                        colors.hover,
                      )}
                    >
                      <CategoryIcon category={category} className={cn("h-[18px] w-[18px]", colors.icon)} />
                    </span>
                    <span className="truncate text-[15px] font-medium tracking-wide text-[#2C2C2C]">
                      {category}
                    </span>
                  </div>
                  <span className="block text-[12px] text-muted-foreground">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                <CategoryGarmentPreviews previews={categoryItems} category={category} />
              </motion.button>
            )
          })}
        </div>

        <div className="mt-7 sm:mt-8">
          <CategoryBreakdown items={items} />
        </div>
      </div>
    </div>
  )
}
