import type { WardrobeItem } from "./wardrobe-data"

export interface CommunityListing {
  id: string
  userId: string
  userName: string
  location: string
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

/** Expanded community listings — AI-assisted demo data */
export const communityListings: CommunityListing[] = [
  {
    id: "c1", userId: "u-alex", userName: "Alex", location: "Amsterdam",
    item: communityItem({ id: "c1-item", name: "Vintage Denim Jacket", brand: "Levi's", imageUrl: "/items/jacket.png", category: "Tops", tag: "Secondhand", wears: 18 }),
  },
  {
    id: "c2", userId: "u-mira", userName: "Mira", location: "Berlin",
    item: communityItem({ id: "c2-item", name: "Wool Overcoat", brand: "Vintage Find", imageUrl: "/items/coat.png", category: "Shirts", tag: "Secondhand", wears: 5 }),
  },
  {
    id: "c3", userId: "u-jon", userName: "Jon", location: "Paris",
    item: communityItem({ id: "c3-item", name: "Canvas Tote Bag", brand: "Baggu", imageUrl: "/items/bag.png", category: "Accessories", tag: "Recycled", wears: 12 }),
  },
  {
    id: "c4", userId: "u-sam", userName: "Sam", location: "London",
    item: communityItem({ id: "c4-item", name: "Leather Sneakers", brand: "Veja", imageUrl: "/items/sneakers.png", category: "Shoes", tag: "Fair Trade", wears: 22 }),
  },
  {
    id: "c5", userId: "u-lee", userName: "Lee", location: "Copenhagen",
    item: communityItem({ id: "c5-item", name: "Hemp Crew Tee", brand: "Patagonia", imageUrl: "/items/tee.png", category: "Tops", tag: "Fair Trade", wears: 30 }),
  },
  {
    id: "c6", userId: "u-rin", userName: "Rin", location: "Stockholm",
    item: communityItem({ id: "c6-item", name: "Recycled Denim Jeans", brand: "Nudie Jeans", imageUrl: "/items/denim.png", category: "Jeans", tag: "Recycled", wears: 14 }),
  },
  {
    id: "c7", userId: "u-noa", userName: "Noa", location: "Utrecht",
    item: communityItem({ id: "c7-item", name: "Organic Linen Blouse", brand: "Armedangels", imageUrl: "/items/blouse.png", category: "Tops", tag: "Organic", wears: 8 }),
  },
  {
    id: "c8", userId: "u-kai", userName: "Kai", location: "Vienna",
    item: communityItem({ id: "c8-item", name: "Merino Wool Sweater", brand: "Icebreaker", imageUrl: "/items/sweater.png", category: "Tops", tag: "Fair Trade", wears: 25 }),
  },
  {
    id: "c9", userId: "u-eve", userName: "Eve", location: "Lisbon",
    item: communityItem({ id: "c9-item", name: "Deadstock Silk Scarf", brand: "Thrift Find", imageUrl: "/items/scarf.png", category: "Accessories", tag: "Deadstock", wears: 6 }),
  },
  {
    id: "c10", userId: "u-tom", userName: "Tom", location: "Zurich",
    item: communityItem({ id: "c10-item", name: "Corduroy Trousers", brand: "Nudie Jeans", imageUrl: "/items/trousers.png", category: "Jeans", tag: "Organic", wears: 11 }),
  },
  {
    id: "c11", userId: "u-maya", userName: "Maya", location: "Barcelona",
    item: communityItem({ id: "c11-item", name: "Vintage Leather Belt", brand: "Thrift Find", imageUrl: "/items/belt.png", category: "Accessories", tag: "Secondhand", wears: 40 }),
  },
  {
    id: "c12", userId: "u-finn", userName: "Finn", location: "Oslo",
    item: communityItem({ id: "c12-item", name: "Recycled Fleece Jacket", brand: "Patagonia", imageUrl: "/items/fleece.png", category: "Tops", tag: "Recycled", wears: 17 }),
  },
  {
    id: "c13", userId: "u-zara", userName: "Zara K.", location: "Brussels",
    item: communityItem({ id: "c13-item", name: "Fair Trade Chinos", brand: "People Tree", imageUrl: "/items/chinos.png", category: "Jeans", tag: "Fair Trade", wears: 9 }),
  },
  {
    id: "c14", userId: "u-hana", userName: "Hana", location: "Milan",
    item: communityItem({ id: "c14-item", name: "Organic Cotton Hoodie", brand: "Stanley/Stella", imageUrl: "/items/hoodie.png", category: "Tops", tag: "Organic", wears: 20 }),
  },
  {
    id: "c15", userId: "u-omar", userName: "Omar", location: "Munich",
    item: communityItem({ id: "c15-item", name: "Bamboo Running Shorts", brand: "Girlfriend Collective", imageUrl: "/items/shorts.png", category: "Shorts", tag: "Recycled", wears: 35 }),
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
    jacket:   ["Tops", "Shirts"],
    fleece:   ["Tops"],
    hoodie:   ["Tops"],
    sweater:  ["Tops"],
    coat:     ["Shirts", "Tops"],
    blouse:   ["Tops", "Shirts"],
    tee:      ["Tops", "Shirts"],
    shirt:    ["Shirts", "Tops"],
    denim:    ["Jeans"],
    jean:     ["Jeans"],
    trouser:  ["Jeans"],
    chino:    ["Jeans"],
    pant:     ["Jeans"],
    short:    ["Shorts"],
    sneaker:  ["Shoes"],
    shoe:     ["Shoes"],
    loafer:   ["Shoes"],
    bag:      ["Accessories"],
    tote:     ["Accessories"],
    scarf:    ["Accessories"],
    belt:     ["Accessories"],
    cap:      ["Accessories"],
    linen:    ["Tops", "Shirts"],
    wool:     ["Tops", "Shirts"],
    silk:     ["Accessories", "Tops"],
    organic:  ["Tops"],
    vintage:  ["Tops", "Jeans", "Accessories"],
    recycled: ["Tops", "Jeans", "Shorts"],
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

  if (!best || best.confidence < 15) return null

  const offering = pickOffering(best.listing.item, userReadyItems)

  return {
    listing: best.listing,
    offering,
    confidence: best.confidence,
  }
}
