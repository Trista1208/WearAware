export type Category = "Tops" | "Shirts" | "Jeans" | "Shorts" | "Shoes" | "Accessories"

export type SustainabilityTag = "Organic" | "Recycled" | "Secondhand" | "Fair Trade" | "Deadstock"

export type ItemStatus = "wardrobe" | "readyToTrade" | "traded"

export interface WardrobeItem {
  id: string
  name: string
  brand: string
  /** Canonical image field — paths under /items/ or upload data URLs */
  imageUrl: string
  /** @deprecated use imageUrl */
  image?: string
  category: Category
  tag: SustainabilityTag
  wears: number
  status: ItemStatus
  /** @deprecated derived from status === "readyToTrade" */
  listed: boolean
  /** @deprecated derived from status === "readyToTrade" */
  readyToPartWith: boolean
}

export const categories: Category[] = ["Tops", "Shirts", "Jeans", "Shorts", "Shoes", "Accessories"]

function seed(
  partial: Omit<WardrobeItem, "image" | "status" | "listed" | "readyToPartWith"> & {
    status?: ItemStatus
  },
): WardrobeItem {
  const status = partial.status ?? "wardrobe"
  return {
    ...partial,
    image: partial.imageUrl,
    status,
    listed: status === "readyToTrade",
    readyToPartWith: status === "readyToTrade",
  }
}

export const initialItems: WardrobeItem[] = [
  seed({
    id: "1",
    name: "Oversized Cotton Jacket",
    brand: "Eileen Fisher",
    imageUrl: "/items/jacket.png",
    category: "Tops",
    tag: "Organic",
    wears: 42,
  }),
  seed({
    id: "2",
    name: "Hemp Crew Tee",
    brand: "Patagonia",
    imageUrl: "/items/tee.png",
    category: "Tops",
    tag: "Fair Trade",
    wears: 88,
  }),
  seed({
    id: "3",
    name: "Merino Knit Sweater",
    brand: "Asket",
    imageUrl: "/items/knit.png",
    category: "Tops",
    tag: "Organic",
    wears: 1,
  }),
  seed({
    id: "12",
    name: "Linen Wrap Dress",
    brand: "Reformation",
    imageUrl: "/items/dress.png",
    category: "Tops",
    tag: "Deadstock",
    wears: 16,
  }),
  seed({
    id: "4",
    name: "Linen Button-Up",
    brand: "Reformation",
    imageUrl: "/items/shirt.png",
    category: "Shirts",
    tag: "Deadstock",
    wears: 23,
  }),
  seed({
    id: "5",
    name: "Wool Overcoat",
    brand: "Vintage Find",
    imageUrl: "/items/coat.png",
    category: "Shirts",
    tag: "Secondhand",
    wears: 0,
  }),
  seed({
    id: "6",
    name: "Recycled Denim",
    brand: "Nudie Jeans",
    imageUrl: "/items/denim.png",
    category: "Jeans",
    tag: "Recycled",
    wears: 60,
  }),
  seed({
    id: "7",
    name: "Organic Chino Shorts",
    brand: "Outerknown",
    imageUrl: "/items/shorts.png",
    category: "Shorts",
    tag: "Organic",
    wears: 12,
  }),
  seed({
    id: "8",
    name: "Leather Sneakers",
    brand: "Veja",
    imageUrl: "/items/sneakers.png",
    category: "Shoes",
    tag: "Fair Trade",
    wears: 75,
  }),
  seed({
    id: "9",
    name: "Suede Loafers",
    brand: "Vintage Find",
    imageUrl: "/items/loafers.png",
    category: "Shoes",
    tag: "Secondhand",
    wears: 1,
  }),
  seed({
    id: "10",
    name: "Canvas Tote Bag",
    brand: "Baggu",
    imageUrl: "/items/bag.png",
    category: "Accessories",
    tag: "Recycled",
    wears: 34,
  }),
  seed({
    id: "11",
    name: "Cotton Cap",
    brand: "Tentree",
    imageUrl: "/items/cap.png",
    category: "Accessories",
    tag: "Organic",
    wears: 0,
  }),
]

export const tagStyles: Record<SustainabilityTag, string> = {
  Organic: "bg-accent text-accent-foreground",
  Recycled: "bg-accent text-accent-foreground",
  Secondhand: "bg-accent text-accent-foreground",
  "Fair Trade": "bg-accent text-accent-foreground",
  Deadstock: "bg-accent text-accent-foreground",
}

export const savingsHistory = [
  { month: "Jan", money: 40, water: 1200, carbon: 8 },
  { month: "Feb", money: 95, water: 2600, carbon: 17 },
  { month: "Mar", money: 160, water: 4100, carbon: 29 },
  { month: "Apr", money: 240, water: 6000, carbon: 44 },
  { month: "May", money: 330, water: 8200, carbon: 61 },
  { month: "Jun", money: 428, water: 10400, carbon: 78 },
]
