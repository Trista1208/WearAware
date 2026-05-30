import type { WardrobeItem } from "./wardrobe-data"

export interface CommunityListing {
  id: string
  userId: string
  userName: string
  item: WardrobeItem
}

function communityItem(
  partial: Omit<WardrobeItem, "image" | "status" | "listed" | "readyToPartWith">,
): WardrobeItem {
  return {
    ...partial,
    image: partial.imageUrl,
    status: "readyToTrade",
    listed: true,
    readyToPartWith: true,
  }
}

/** Mock peer listings drawn from community "ready to part with" collections. */
export const communityListings: CommunityListing[] = [
  {
    id: "c1",
    userId: "u-alex",
    userName: "Alex",
    item: communityItem({
      id: "c1-item",
      name: "Vintage Denim Jacket",
      brand: "Levi's",
      imageUrl: "/items/jacket.png",
      category: "Tops",
      tag: "Secondhand",
      wears: 18,
    }),
  },
  {
    id: "c2",
    userId: "u-mira",
    userName: "Mira",
    item: communityItem({
      id: "c2-item",
      name: "Wool Overcoat",
      brand: "Vintage Find",
      imageUrl: "/items/coat.png",
      category: "Shirts",
      tag: "Secondhand",
      wears: 5,
    }),
  },
  {
    id: "c3",
    userId: "u-jon",
    userName: "Jon",
    item: communityItem({
      id: "c3-item",
      name: "Canvas Tote Bag",
      brand: "Baggu",
      imageUrl: "/items/bag.png",
      category: "Accessories",
      tag: "Recycled",
      wears: 12,
    }),
  },
  {
    id: "c4",
    userId: "u-sam",
    userName: "Sam",
    item: communityItem({
      id: "c4-item",
      name: "Leather Sneakers",
      brand: "Veja",
      imageUrl: "/items/sneakers.png",
      category: "Shoes",
      tag: "Fair Trade",
      wears: 22,
    }),
  },
  {
    id: "c5",
    userId: "u-lee",
    userName: "Lee",
    item: communityItem({
      id: "c5-item",
      name: "Hemp Crew Tee",
      brand: "Patagonia",
      imageUrl: "/items/tee.png",
      category: "Tops",
      tag: "Fair Trade",
      wears: 30,
    }),
  },
  {
    id: "c6",
    userId: "u-rin",
    userName: "Rin",
    item: communityItem({
      id: "c6-item",
      name: "Recycled Denim",
      brand: "Nudie Jeans",
      imageUrl: "/items/denim.png",
      category: "Jeans",
      tag: "Recycled",
      wears: 14,
    }),
  },
]

export interface TradeMatch {
  listing: CommunityListing
  offering: WardrobeItem | null
  confidence: number
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,/\-]+/)
    .filter((t) => t.length > 2)
}

function scoreMatch(query: string, item: WardrobeItem): number {
  const q = query.toLowerCase()
  const hay = `${item.name} ${item.brand} ${item.category}`.toLowerCase()
  let score = 0

  if (hay.includes(q)) score += 100
  if (item.name.toLowerCase().includes(q) || q.includes(item.name.toLowerCase())) score += 80

  const tokens = tokenize(query)
  for (const token of tokens) {
    if (hay.includes(token)) score += 25
  }

  const categoryWords: Record<string, string[]> = {
    jacket: ["Tops", "Shirts"],
    coat: ["Shirts", "Tops"],
    tee: ["Tops", "Shirts"],
    shirt: ["Shirts", "Tops"],
    denim: ["Jeans"],
    jean: ["Jeans"],
    short: ["Shorts"],
    sneaker: ["Shoes"],
    shoe: ["Shoes"],
    loafer: ["Shoes"],
    bag: ["Accessories"],
    cap: ["Accessories"],
    tote: ["Accessories"],
  }

  for (const [word, cats] of Object.entries(categoryWords)) {
    if (q.includes(word) && cats.includes(item.category)) score += 15
  }

  return score
}

function pickOffering(
  wanted: WardrobeItem,
  userReadyItems: WardrobeItem[],
): WardrobeItem | null {
  if (userReadyItems.length === 0) return null

  const sameCategory = userReadyItems.filter((i) => i.category === wanted.category)
  if (sameCategory.length > 0) {
    return sameCategory.sort((a, b) => a.wears - b.wears)[0]
  }

  return userReadyItems.sort((a, b) => a.wears - b.wears)[0]
}

export function findTradeMatch(
  query: string,
  userReadyItems: WardrobeItem[],
): TradeMatch | null {
  const trimmed = query.trim()
  if (!trimmed) return null

  let best: { listing: CommunityListing; confidence: number } | null = null

  for (const listing of communityListings) {
    const confidence = scoreMatch(trimmed, listing.item)
    if (!best || confidence > best.confidence) {
      best = { listing, confidence }
    }
  }

  if (!best || best.confidence < 20) return null

  const offering = pickOffering(best.listing.item, userReadyItems)

  return {
    listing: best.listing,
    offering,
    confidence: best.confidence,
  }
}
