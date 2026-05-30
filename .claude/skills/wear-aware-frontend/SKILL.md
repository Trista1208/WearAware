# Wear Aware — Frontend Design Skill

Use this skill whenever building, reviewing, or modifying any UI in the Wear Aware app.
It is the single source of truth for visual language, component patterns, motion, and spacing.

---

## Design Philosophy

Wear Aware is a **premium minimalist sustainable wardrobe app**. Every design decision should
feel like the intersection of an Apple product launch page and a luxury fashion showroom:
calm, spacious, intentional, and tactile.

**Never** reach for:
- Generic SaaS dashboard layouts
- Neon or saturated accent colors
- Random gradients or color washes
- Excessive glassmorphism (frosted panels everywhere)
- Futuristic blue AI aesthetics
- Cluttered sidebars or dense data tables

---

## Color Palette

| Role               | Value       | Usage                                          |
|--------------------|-------------|------------------------------------------------|
| Background         | `#FAF8F5`   | Warm cream — every page canvas                 |
| Card / Surface     | `#FFFFF8`   | Ivory — elevated content containers            |
| Primary Text       | `#2C2C2C`   | Charcoal — headings, body, labels              |
| Secondary Text     | `#6B6B6B`   | Medium grey — captions, metadata, hints        |
| Accent             | `#7A8C6E`   | Muted olive — interactive highlights, tags     |
| Accent Hover       | `#5E6E55`   | Darker olive — hover/active states             |
| Shadow             | `rgba(180, 165, 140, 0.18)` | Soft beige shadow — cards, modals |
| Border             | `rgba(180, 165, 140, 0.25)` | Hairline separation                |
| Desaturated Garment| Apply CSS `filter: saturate(0.35) brightness(0.95)` | Underused clothing |
| Vivid Garment      | No filter or `filter: saturate(1.1)` | Frequently worn clothing       |

All colors must pass WCAG AA contrast against the background they sit on.

---

## Typography

Font stack: `'Inter', system-ui, -apple-system, sans-serif` for UI.
Optional editorial accent: `'Cormorant Garamond', Georgia, serif` for hero headings only.

| Scale       | Size    | Weight | Line Height | Usage                          |
|-------------|---------|--------|-------------|--------------------------------|
| Display     | 40px    | 300    | 1.15        | Hero / wardrobe title          |
| Heading 1   | 28px    | 400    | 1.25        | Page-level headings            |
| Heading 2   | 20px    | 500    | 1.3         | Section headings               |
| Body        | 15px    | 400    | 1.6         | All running text               |
| Label       | 13px    | 500    | 1.4         | Form labels, column headers    |
| Caption     | 11px    | 400    | 1.5         | Metadata, timestamps           |

Rules:
- Never use font-weight above 600 in body copy — let spacing do the work.
- Letter-spacing: `0.01em` on headings, `0` on body.
- Avoid all-caps except single-word labels (e.g. score badges).
- Text must never overflow its container — use `text-overflow: ellipsis` with `overflow: hidden`.

---

## Spacing — 8px Grid

All margin, padding, gap, and sizing values must be multiples of 8px.

| Token | Value | Common use                          |
|-------|-------|-------------------------------------|
| `sp1` | 8px   | Inline icon gaps, tight row padding |
| `sp2` | 16px  | Card internal padding (small)       |
| `sp3` | 24px  | Card internal padding (standard)    |
| `sp4` | 32px  | Between sections within a panel     |
| `sp5` | 40px  | Between major layout sections       |
| `sp6` | 48px  | Page-level vertical rhythm          |
| `sp8` | 64px  | Hero or wardrobe stage top padding  |

Use `gap` on flex/grid containers instead of individual margins wherever possible.
Never hard-code pixel values outside these tokens.

---

## Core UI Objects

### Central Cylindrical Wardrobe

The wardrobe is the **hero object** of the app — a rotating cylinder that holds garment cards.
It is rendered on the main dashboard and should feel three-dimensional and tactile.

- Implemented with CSS `perspective` + `rotateY` transforms, or a canvas / Three.js layer.
- Garment cards are arranged around the cylinder at equal angular intervals.
- Rotation is user-driven (drag / scroll) with momentum, not auto-spinning.
- Each garment card on the cylinder responds to usage frequency:
  - **Frequently worn** → full color, soft warm glow (`box-shadow: 0 0 16px rgba(180,160,120,0.25)`)
  - **Underused** → `filter: saturate(0.35) brightness(0.95)` — visually fades without hiding

### Aware Score Panel

A right-side or bottom panel (context-dependent) showing the user's sustainability score.

- Large numeral (Display scale) in charcoal, no decorative circles or gauge rings.
- Sub-labels in Caption scale, olive accent for positive delta.
- Breakdown list uses subtle horizontal rules, not heavy borders.
- Score should animate counting up on first mount (Framer Motion `useMotionValue` + `animate`).

### Ready to Part With Tray

A collapsible bottom tray (or left drawer on wide screens) surfacing garments the algorithm
flags for donation or resale.

- Tray handle is a centered pill — 40px wide, 4px tall, `#C5B8A8`, rounded.
- Garments inside are shown as small tiles with strong desaturation filter.
- Tray opens with a smooth spring animation (see Motion rules).
- Never auto-open; only open on user interaction or explicit prompt.

---

## Motion Rules (Framer Motion)

All interactive motion must feel physical, not digital. Use spring physics for layout changes
and ease curves for simple fades.

### Spring presets

```ts
// Standard — most interactive elements
const spring = { type: 'spring', stiffness: 260, damping: 28 }

// Gentle — panels, trays, drawers
const springGentle = { type: 'spring', stiffness: 180, damping: 24 }

// Snappy — micro-interactions, toggles
const springSnappy = { type: 'spring', stiffness: 400, damping: 30 }
```

### Easing presets

```ts
const easeFade = { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
const easeEnter = { duration: 0.35, ease: [0.0, 0.0, 0.2, 1] }
const easeExit = { duration: 0.2, ease: [0.4, 0, 1, 1] }
```

### Standard patterns

| Interaction              | Pattern                                                    |
|--------------------------|------------------------------------------------------------|
| Page enter               | `opacity: 0→1`, `y: 12→0`, `easeEnter`                    |
| Card hover lift          | `y: -4`, `box-shadow` transition, `spring`                 |
| Tray open/close          | `y: 100%→0`, `springGentle`                                |
| Garment score color fade | `filter` CSS transition, `duration: 600ms ease`            |
| Score count-up           | `useMotionValue` + `animate` to target, `duration: 1.2s`  |
| Wardrobe cylinder rotate | `rotateY` driven by drag delta, momentum via `inertia`     |

Rules:
- No animation should exceed 500ms (except deliberate slow reveals).
- `AnimatePresence` must wrap any conditionally rendered panel or modal.
- Never animate `width` or `height` directly — animate `scaleX`/`scaleY` or use `layout` prop.
- Reduce-motion: wrap all non-essential animations in a `prefersReducedMotion` check.

---

## Reusable Component Guidance

### `<GarmentCard>`
- Size: 160×220px (portrait) or 120×160px (cylinder tile).
- Background: ivory (`#FFFFF8`), border-radius `12px`.
- Shadow: `0 2px 12px rgba(180, 165, 140, 0.18)`.
- Usage filter applied as a CSS custom property `--usage-filter` so it can be animated.
- Image fills top ~65% of card; metadata sits in bottom third with `sp2` padding.

### `<ScoreBadge>`
- Pill shape, background: muted olive at 12% opacity, text in olive.
- Height: 24px, horizontal padding: `sp2`.
- Never use a colored circle or dot — text label only.

### `<PanelShell>`
- White-to-ivory surface, `border-radius: 16px`, beige shadow.
- Standard internal padding: `sp3` all sides.
- Header row: section title (Heading 2) + optional trailing action (Label, olive).
- Divider: `1px solid rgba(180, 165, 140, 0.25)` — never a heavy rule.

### `<Tray>`
- Fixed to bottom of viewport, full width, max-height `60vh`, overflow scroll.
- Background: `#FAF8F5`, top border-radius `20px`, beige shadow upward.
- Handle centered at top. Drag-to-dismiss via Framer Motion `drag="y"`.

### `<EmptyState>`
- Centered illustration (line-art, no color fills), Caption text below.
- No heavy call-to-action boxes — one text link in olive is enough.

---

## Do / Don't Summary

| Do                                              | Don't                                      |
|-------------------------------------------------|--------------------------------------------|
| Use cream, ivory, charcoal, muted olive         | Use saturated colors, neon, or bright blue |
| Let whitespace carry the layout                 | Fill every pixel with content or UI chrome |
| Animate with spring physics                     | Use linear or bounce easing                |
| Desaturate underused garments subtly            | Hide or remove them from the wardrobe      |
| Surface the score as a calm number              | Use speedometers, donut charts, or gauges  |
| Keep the cylinder as the focal point            | Fragment attention with competing hero UI  |
| Use `<AnimatePresence>` for conditional renders | Pop elements in/out without transition     |
| Apply the 8px spacing grid strictly             | Use arbitrary px values                    |
