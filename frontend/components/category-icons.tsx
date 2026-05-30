import {
  Layers,
  Shirt,
  Footprints,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"
import type { Category } from "@/lib/wardrobe-data"
import { cn } from "@/lib/utils"

export const categoryColors: Record<
  Category,
  { bg: string; icon: string; bar: string; barSoft: string; dot: string; hover: string }
> = {
  Tops: {
    bg: "bg-[rgba(196,142,112,0.1)]",
    icon: "text-[#A06848]/70",
    bar: "bg-[#C48E70]",
    barSoft: "bg-[#C48E70]/55",
    dot: "bg-[#C48E70]/80",
    hover: "group-hover:bg-[rgba(196,142,112,0.16)]",
  },
  Shirts: {
    bg: "bg-[rgba(122,140,110,0.1)]",
    icon: "text-[#5E6E55]/70",
    bar: "bg-[#7A8C6E]",
    barSoft: "bg-[#7A8C6E]/55",
    dot: "bg-[#7A8C6E]/80",
    hover: "group-hover:bg-[rgba(122,140,110,0.16)]",
  },
  Jeans: {
    bg: "bg-[rgba(108,130,158,0.1)]",
    icon: "text-[#4A6278]/70",
    bar: "bg-[#6C829E]",
    barSoft: "bg-[#6C829E]/50",
    dot: "bg-[#6C829E]/75",
    hover: "group-hover:bg-[rgba(108,130,158,0.16)]",
  },
  Shorts: {
    bg: "bg-[rgba(196,168,108,0.1)]",
    icon: "text-[#8A7340]/70",
    bar: "bg-[#C4A86C]",
    barSoft: "bg-[#C4A86C]/55",
    dot: "bg-[#C4A86C]/80",
    hover: "group-hover:bg-[rgba(196,168,108,0.16)]",
  },
  Shoes: {
    bg: "bg-[rgba(140,118,98,0.1)]",
    icon: "text-[#6E5A48]/70",
    bar: "bg-[#8C7662]",
    barSoft: "bg-[#8C7662]/55",
    dot: "bg-[#8C7662]/80",
    hover: "group-hover:bg-[rgba(140,118,98,0.16)]",
  },
  Accessories: {
    bg: "bg-[rgba(158,130,148,0.1)]",
    icon: "text-[#7A6270]/70",
    bar: "bg-[#9E8294]",
    barSoft: "bg-[#9E8294]/50",
    dot: "bg-[#9E8294]/75",
    hover: "group-hover:bg-[rgba(158,130,148,0.16)]",
  },
}

function JeansIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 3h8l1 4-1.5 14h-3L12 11l-0.5 10h-3L7 7l1-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 7h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ShortsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 3h8l1 4-0.5 5H16l-0.5 9h-3L12 12l-0.5 9h-3L8 12H7.5L8 7l0-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 7h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type CategoryIconProps = { category: Category; className?: string }

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const shared = cn("h-5 w-5", className)

  switch (category) {
    case "Tops":
      return <Layers className={shared} />
    case "Shirts":
      return <Shirt className={shared} />
    case "Jeans":
      return <JeansIcon className={shared} />
    case "Shorts":
      return <ShortsIcon className={shared} />
    case "Shoes":
      return <Footprints className={shared} />
    case "Accessories":
      return <ShoppingBag className={shared} />
  }
}

export function getCategoryIcon(category: Category): LucideIcon | null {
  const map: Partial<Record<Category, LucideIcon>> = {
    Tops: Layers,
    Shirts: Shirt,
    Shoes: Footprints,
    Accessories: ShoppingBag,
  }
  return map[category] ?? null
}
