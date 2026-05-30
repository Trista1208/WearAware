import type { SustainabilityTag, WardrobeItem } from "./wardrobe-data"

const TAG_SCORE: Record<SustainabilityTag, number> = {
  Organic: 12,
  Recycled: 14,
  Secondhand: 18,
  "Fair Trade": 16,
  Deadstock: 10,
}

const TAG_WEIGHT = 0.35
const WEAR_WEIGHT = 0.4
const SIZE_WEIGHT = 0.15
const TRADE_WEIGHT = 0.1

export interface ScoreBreakdown {
  total: number
  tagContribution: number
  wearContribution: number
  sizeContribution: number
  tradeBonus: number
}

export function computeAwareScore(
  items: WardrobeItem[],
  tradeBonus = 0,
): ScoreBreakdown {
  if (items.length === 0) {
    return { total: 0, tagContribution: 0, wearContribution: 0, sizeContribution: 0, tradeBonus: 0 }
  }

  const tagContribution =
    items.reduce((sum, item) => sum + TAG_SCORE[item.tag], 0) / items.length

  const wearRates = items.map((item) => Math.min(item.wears / 30, 1))
  const wearContribution = (wearRates.reduce((a, b) => a + b, 0) / items.length) * 100

  const idealSize = 25
  const sizeDelta = Math.abs(items.length - idealSize)
  const sizeContribution = Math.max(0, 100 - sizeDelta * 4)

  const tradeBonusClamped = Math.min(tradeBonus, 15)
  const raw =
    tagContribution * TAG_WEIGHT +
    wearContribution * WEAR_WEIGHT +
    sizeContribution * SIZE_WEIGHT +
    tradeBonusClamped * TRADE_WEIGHT * (100 / 15)

  const total = Math.round(Math.min(100, Math.max(0, raw)))

  return {
    total,
    tagContribution: Math.round(tagContribution),
    wearContribution: Math.round(wearContribution),
    sizeContribution: Math.round(sizeContribution),
    tradeBonus: tradeBonusClamped,
  }
}

export type BuyVerdict = "buy" | "skip"

export interface BuyAdvice {
  verdict: BuyVerdict
  headline: string
  reason: string
  scoreDelta: number
}

export function getBuyAdvice(
  description: string,
  items: WardrobeItem[],
): BuyAdvice {
  const query = description.toLowerCase().trim()
  if (!query) {
    return {
      verdict: "skip",
      headline: "Need more detail",
      reason: "Describe the piece so we can compare it to your wardrobe.",
      scoreDelta: 0,
    }
  }

  const similar = items.filter((item) => {
    const hay = `${item.name} ${item.brand} ${item.category}`.toLowerCase()
    const tokens = query.split(/\s+/).filter((t) => t.length > 2)
    return tokens.some((token) => hay.includes(token))
  })

  const categoryGuess = items.find((item) => query.includes(item.category.toLowerCase()))
  const avgWears =
    items.length > 0 ? items.reduce((s, i) => s + i.wears, 0) / items.length : 0
  const underused = items.filter((i) => i.wears <= 2).length

  if (similar.length >= 2) {
    return {
      verdict: "skip",
      headline: "Skip this purchase",
      reason: `You already own ${similar.length} similar pieces (${similar
        .slice(0, 2)
        .map((i) => i.name)
        .join(", ")}). Adding another would lower your Aware Score and increase unused inventory.`,
      scoreDelta: -8,
    }
  }

  if (similar.length === 1 && similar[0].wears < 5) {
    return {
      verdict: "skip",
      headline: "Wear what you have first",
      reason: `Your ${similar[0].name} is barely worn (${similar[0].wears}×). Rewearing it keeps your score strong before buying anything new.`,
      scoreDelta: -5,
    }
  }

  const sustainableKeywords = ["organic", "recycled", "secondhand", "thrift", "vintage", "fair trade"]
  const isSustainableListing = sustainableKeywords.some((k) => query.includes(k))

  if (isSustainableListing && similar.length === 0) {
    return {
      verdict: "buy",
      headline: "Good mindful addition",
      reason: `Nothing like this in your wardrobe${
        categoryGuess ? ` (${categoryGuess.category})` : ""
      }. A pre-loved or sustainable source fits your style and supports circular fashion.`,
      scoreDelta: 6,
    }
  }

  if (underused > items.length * 0.4 && avgWears < 15) {
    return {
      verdict: "skip",
      headline: "Strengthen what you own",
      reason: `${underused} pieces are underused. Rotating them more will raise your score faster than a new purchase.`,
      scoreDelta: -6,
    }
  }

  if (similar.length === 0) {
    return {
      verdict: "buy",
      headline: "Fills a real gap",
      reason: "No close match in your wardrobe. If the quality is good and you'll wear it 30+ times, it's a reasonable add.",
      scoreDelta: 3,
    }
  }

  return {
    verdict: "skip",
    headline: "Probably redundant",
    reason: `You have ${similar[0].name} already. Unless this replaces worn-out gear, skip it to protect your score.`,
    scoreDelta: -4,
  }
}

export function getUsageFilter(wears: number): string {
  if (wears >= 20) return "saturate(1.08) brightness(1.02)"
  if (wears >= 8) return "none"
  if (wears >= 3) return "saturate(0.65) brightness(0.97)"
  return "saturate(0.35) brightness(0.95)"
}
