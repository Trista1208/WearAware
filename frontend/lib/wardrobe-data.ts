export type Category = "Tops" | "Shirts" | "Jeans" | "Shorts" | "Shoes" | "Accessories"

export type SustainabilityTag = "Organic" | "Recycled" | "Secondhand" | "Fair Trade" | "Deadstock"

export interface WardrobeItem {
  id: string
  name: string
  brand: string
  image: string
  category: Category
  tag: SustainabilityTag
  wears: number
  listed: boolean
}

export const categories: Category[] = ["Tops", "Shirts", "Jeans", "Shorts", "Shoes", "Accessories"]

export const initialItems: WardrobeItem[] = [
  {
    id: "1",
    name: "Oversized Cotton Jacket",
    brand: "Eileen Fisher",
    image: "/items/jacket.png",
    category: "Tops",
    tag: "Organic",
    wears: 42,
    listed: false,
  },
  {
    id: "2",
    name: "Hemp Crew Tee",
    brand: "Patagonia",
    image: "/items/tee.png",
    category: "Tops",
    tag: "Fair Trade",
    wears: 88,
    listed: false,
  },
  {
    id: "3",
    name: "Merino Knit Sweater",
    brand: "Asket",
    image: "/items/knit.png",
    category: "Tops",
    tag: "Organic",
    wears: 1,
    listed: false,
  },
  {
    id: "4",
    name: "Linen Button-Up",
    brand: "Reformation",
    image: "/items/shirt.png",
    category: "Shirts",
    tag: "Deadstock",
    wears: 23,
    listed: false,
  },
  {
    id: "5",
    name: "Wool Overcoat",
    brand: "Vintage Find",
    image: "/items/coat.png",
    category: "Shirts",
    tag: "Secondhand",
    wears: 0,
    listed: false,
  },
  {
    id: "6",
    name: "Recycled Denim",
    brand: "Nudie Jeans",
    image: "/items/denim.png",
    category: "Jeans",
    tag: "Recycled",
    wears: 60,
    listed: false,
  },
  {
    id: "7",
    name: "Organic Chino Shorts",
    brand: "Outerknown",
    image: "/items/shorts.png",
    category: "Shorts",
    tag: "Organic",
    wears: 12,
    listed: false,
  },
  {
    id: "8",
    name: "Leather Sneakers",
    brand: "Veja",
    image: "/items/sneakers.png",
    category: "Shoes",
    tag: "Fair Trade",
    wears: 75,
    listed: false,
  },
  {
    id: "9",
    name: "Suede Loafers",
    brand: "Vintage Find",
    image: "/items/loafers.png",
    category: "Shoes",
    tag: "Secondhand",
    wears: 1,
    listed: false,
  },
  {
    id: "10",
    name: "Canvas Tote Bag",
    brand: "Baggu",
    image: "/items/bag.png",
    category: "Accessories",
    tag: "Recycled",
    wears: 34,
    listed: false,
  },
  {
    id: "11",
    name: "Cotton Cap",
    brand: "Tentree",
    image: "/items/cap.png",
    category: "Accessories",
    tag: "Organic",
    wears: 0,
    listed: false,
  },
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
