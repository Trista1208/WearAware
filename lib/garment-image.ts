import type { Category, WardrobeItem } from "./wardrobe-data"
import { mockGarmentImage } from "./mock-garment-images"

type ImageSource = Partial<Pick<WardrobeItem, "imageUrl" | "image">>

const PLACEHOLDER_PATHS = new Set(["", "/placeholder.svg", "/placeholder.svg?height=300&width=220"])

/** Resolve canonical image URL from imageUrl, legacy image, or photoUrl. */
export function getItemImageUrl(item: ImageSource & { photoUrl?: string }): string | null {
  const url = item.imageUrl || item.image || item.photoUrl
  if (!url || PLACEHOLDER_PATHS.has(url)) return null
  return url
}

/** Fallback silhouette when no real image is available. */
export function getGarmentFallbackUrl(category: Category): string {
  return mockGarmentImage(category)
}

export function resolveGarmentImage(item: WardrobeItem): string {
  return getItemImageUrl(item) ?? getGarmentFallbackUrl(item.category)
}

/** Normalize legacy items to canonical imageUrl + status. */
export function normalizeWardrobeItem(item: WardrobeItem): WardrobeItem {
  const status =
    item.status ??
    (item.readyToPartWith ? "readyToTrade" : ("wardrobe" as const))

  const imageUrl =
    item.imageUrl ||
    (item.image && !PLACEHOLDER_PATHS.has(item.image) ? item.image : "")

  return {
    ...item,
    status,
    imageUrl,
    image: imageUrl || item.image,
    readyToPartWith: status === "readyToTrade",
    listed: status === "readyToTrade",
  }
}
