"use client"

import { useState } from "react"
import type { Category, WardrobeItem } from "@/lib/wardrobe-data"
import { getGarmentFallbackUrl, getItemImageUrl } from "@/lib/garment-image"
import { cn } from "@/lib/utils"

function GarmentSilhouette({ category, className }: { category: Category; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-b from-[#FDF6EC] to-[#F1E4D2]",
        className,
      )}
    >
      <img
        src={getGarmentFallbackUrl(category)}
        alt=""
        className="h-[78%] w-[78%] object-contain opacity-90"
        draggable={false}
      />
    </div>
  )
}

interface GarmentImageProps {
  item: Pick<WardrobeItem, "category" | "name"> & {
    imageUrl?: string
    image?: string
  }
  className?: string
  imgClassName?: string
  style?: React.CSSProperties
}

export function GarmentImage({ item, className, imgClassName, style }: GarmentImageProps) {
  const src = getItemImageUrl(item)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <GarmentSilhouette category={item.category} className={className} />
  }

  return (
    <img
      src={src}
      alt={item.name}
      className={cn("h-full w-full object-contain", imgClassName, className)}
      style={style}
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}
