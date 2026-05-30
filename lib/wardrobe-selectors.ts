import type { Category, ItemStatus, WardrobeItem } from "./wardrobe-data"

/** Active pieces hanging in the wardrobe (excludes ready-to-trade and traded). */
export function getWardrobeItems(items: WardrobeItem[]): WardrobeItem[] {
  return items.filter((i) => i.status === "wardrobe")
}

export function getReadyToTradeItems(items: WardrobeItem[]): WardrobeItem[] {
  return items.filter((i) => i.status === "readyToTrade")
}

export function getItemsByCategory(items: WardrobeItem[], category: Category): WardrobeItem[] {
  return getWardrobeItems(items).filter((i) => i.category === category)
}

export function getCategoryCounts(items: WardrobeItem[]) {
  const wardrobe = getWardrobeItems(items)
  const total = wardrobe.length || 1
  return wardrobe.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1
      return acc
    },
    {} as Partial<Record<Category, number>>,
  )
}

export function getWardrobeMix(items: WardrobeItem[]) {
  const wardrobe = getWardrobeItems(items)
  const total = wardrobe.length
  const categories = ["Tops", "Shirts", "Jeans", "Shorts", "Shoes", "Accessories"] as const

  const counts = categories.map((category) => ({
    category,
    count: wardrobe.filter((i) => i.category === category).length,
  }))

  if (total === 0) {
    return counts.map((c) => ({ ...c, pct: 0 }))
  }

  // Largest-remainder method so percentages always sum to exactly 100.
  const raw = counts.map((c) => ({ ...c, exact: (c.count / total) * 100 }))
  const withFloor = raw.map((c) => ({ ...c, pct: Math.floor(c.exact), rem: c.exact - Math.floor(c.exact) }))
  let leftover = 100 - withFloor.reduce((s, c) => s + c.pct, 0)

  // Hand out the remaining points to the largest fractional remainders (non-empty categories first).
  const order = [...withFloor]
    .map((c, i) => ({ i, rem: c.rem, count: c.count }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.rem - a.rem)

  for (let k = 0; k < order.length && leftover > 0; k++, leftover--) {
    withFloor[order[k].i].pct += 1
  }

  return withFloor.map(({ category, count, pct }) => ({ category, count, pct }))
}

export function withStatus(item: WardrobeItem, status: ItemStatus): WardrobeItem {
  return {
    ...item,
    status,
    readyToPartWith: status === "readyToTrade",
    listed: status === "readyToTrade",
  }
}
