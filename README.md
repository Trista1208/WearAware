# WearAware

> Sustainable wardrobe tracker — wear more of what you own, buy less of what you don't need.

## Structure

```
WearAware/
├── backend/    Express + TypeScript API (port 3000)
│   ├── src/            Route handlers, services, middleware
│   ├── supabase/       SQL migrations (run in Supabase SQL Editor)
│   └── scripts/        Seed & utility scripts
└── frontend/   Next.js 16 + React 19 UI (port 3001)
    ├── app/            Pages (App Router)
    ├── components/     UI components
    └── lib/            API client, auth context, data
```

## Quick Start

### 1 — Install dependencies
```bash
npm run install:all
```

### 2 — Configure environment
```bash
# Backend secrets
cp backend/.env.example backend/.env
# Fill in your Supabase URL, anon key, and service role key
```

### 3 — Run both servers together
```bash
npm install          # installs concurrently at root
npm run dev          # starts backend (3000) + frontend (3001) simultaneously
```

Or run them separately:
```bash
npm run backend      # only the API
npm run frontend     # only the UI
```

### 4 — Seed test data
```bash
npm run seed
# Creates demo user: demo.wearaware@gmail.com / WearAware2026!
```

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Backend    | Node.js, TypeScript, Express |
| Database   | PostgreSQL via Supabase (hosted) |
| Auth       | Supabase Auth (JWT) |
| Frontend   | Next.js 16, React 19, Tailwind CSS |
| UI Library | Radix UI, shadcn/ui, Framer Motion |

## Features

- **Digital Wardrobe** — catalogue every piece with category, brand, material, condition
- **Wear Tracker** — log daily wears to measure utilisation
- **Sustainability Score** — custom algorithm (base 100, penalties for fast fashion, duplicates, low wear, large wardrobes; bonuses for high wear frequency)
- **Score Breakdown** — full transparency on every point gain/loss
- **Marketplace / Matching** — list items as "ready to part with", search for wanted items, propose peer-to-peer swaps
- **Partner Stores** — donate to local second-hand stores and earn sustainability points
- **Analytics** — live wardrobe stats, wear trends, insights, savings estimates

## Test credentials
```
Email:    demo.wearaware@gmail.com
Password: WearAware2026!
```
