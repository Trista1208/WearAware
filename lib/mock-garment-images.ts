import type { Category } from "./wardrobe-data"

const PALETTE: Record<Category, { bg: string; accent: string }> = {
  Tops: { bg: "#EDE6DA", accent: "#A06848" },
  Shirts: { bg: "#E4E8DF", accent: "#5E6E55" },
  Jeans: { bg: "#E0E6ED", accent: "#4A6278" },
  Shorts: { bg: "#EDE8D8", accent: "#8A7340" },
  Shoes: { bg: "#E8E2DC", accent: "#6E5A48" },
  Accessories: { bg: "#EBE4E8", accent: "#7A6270" },
}

/** Premium inline SVG garment previews for mock wardrobe items. */
export function mockGarmentImage(category: Category, variant = 0): string {
  const { bg, accent } = PALETTE[category]
  const shapes: Record<Category, string> = {
    Tops: `<path d="M52 28c-8 0-14 6-14 14v8l-18 10v72h64V60L66 50V42c0-8-6-14-14-14z" fill="${accent}" opacity="0.85"/><path d="M38 52l14-8 14 8" stroke="${accent}" stroke-width="2" fill="none" opacity="0.5"/>`,
    Shirts: `<path d="M40 32h40l6 14-10 8v58H34V54l-10-8 6-14z" fill="${accent}" opacity="0.82"/><path d="M44 46h40" stroke="#FFFFF8" stroke-width="2" opacity="0.4"/>`,
    Jeans: `<path d="M44 24h32l4 12-2 68h-14l-2-36-2 36H42L40 36l4-12z" fill="${accent}" opacity="0.88"/>`,
    Shorts: `<path d="M44 24h32l4 10-2 34h-12l-2-18-2 18H42L40 34l4-10z" fill="${accent}" opacity="0.86"/>`,
    Shoes: `<path d="M32 72c0-8 8-14 18-14h20c10 0 18 6 18 14v8H32v-8z" fill="${accent}" opacity="0.9"/><ellipse cx="52" cy="72" rx="28" ry="6" fill="${accent}" opacity="0.35"/>`,
    Accessories: `<rect x="34" y="36" width="36" height="44" rx="6" fill="${accent}" opacity="0.75"/><path d="M42 36V28h20v8" stroke="${accent}" stroke-width="3" fill="none" opacity="0.6"/>`,
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104">
    <rect width="104" height="104" fill="${bg}" rx="12"/>
    <g transform="translate(0 ${variant * 2})">${shapes[category]}</g>
  </svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
