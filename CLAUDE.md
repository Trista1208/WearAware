@AGENTS.md

# Wear Aware — Project Context

## What We Are Building

Wear Aware is an AI-powered sustainable digital wardrobe app being built for the
**START Zürich Hackathon** under the **sustainable idea** track. The project addresses
one or more UN Sustainable Development Goals — primarily SDG 12 (Responsible Consumption
and Production) by helping users understand and improve their clothing habits.

## Core Idea

Users upload the clothes they own into an interactive digital wardrobe. The app tracks
wear frequency, surfaces underused items, and gives users an **Aware Score** — a measure
of how sustainably they are managing their wardrobe. An AI purchase-check feature advises
users whether buying new clothes makes sense given what they already own.

## Key Features

| Feature | Description |
|---|---|
| **Digital Wardrobe** | Central cylindrical UI holding all uploaded garments |
| **Usage Frequency Viz** | Underused clothes appear grey/desaturated; frequently worn ones are brighter |
| **Aware Score** | A score reflecting sustainable wardrobe behavior (wear rate, item age, diversity) |
| **AI Purchase Check** | Before buying something new, get AI advice based on existing wardrobe |
| **Ready to Part With Tray** | Surface unused items and move them into a circular exchange flow |
| **Circular Exchange** | Potential matching with other users or local second-hand stores (stretch goal) |

## Tech Stack

- **Framework**: Next.js App Router (TypeScript)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Data**: Mock data only — no backend or auth yet

## Branch Structure

- `front_end` — active development branch for all UI work
- `main` — stable base

## Design System

All UI must follow the **Wear Aware frontend design skill** located at:
`.claude/skills/wear-aware-frontend/SKILL.md`

Key constraints (details in the skill file):
- Warm cream background (`#FAF8F5`), ivory cards, charcoal text, muted olive accents
- Central cylindrical wardrobe is the hero UI object — never let other panels compete with it
- 8px spacing grid, Inter typeface, Framer Motion spring physics for all animation
- No generic SaaS dashboards, no neon, no glassmorphism, no blue AI aesthetic

## Development Priorities

1. **One beautiful polished wardrobe experience** over many unfinished pages.
   Get the cylindrical wardrobe, garment cards, Aware Score panel, and Ready to Part With
   tray working and feeling premium before touching anything else.
2. Use **mock data** for garments, wear counts, and scores. Do not wire up a real backend.
3. Do **not** add authentication, user accounts, or API routes yet.
4. Treat every interaction as shippable to a hackathon judge — visual polish matters.

## What to Avoid

- Do not create placeholder pages just to have routes — build fewer things, finish them.
- Do not deviate from the color palette or spacing grid.
- Do not add loading spinners or skeleton screens until real async data exists.
- Do not introduce new dependencies without checking the existing stack first.
