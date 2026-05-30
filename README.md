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
<<<<<<< HEAD

=======
>>>>>>> origin/full_version_v1
```bash
npm run install:all
```

### 2 — Configure environment
<<<<<<< HEAD

=======
>>>>>>> origin/full_version_v1
```bash
# Backend secrets
cp backend/.env.example backend/.env
# Fill in your Supabase URL, anon key, and service role key
```

### 3 — Run both servers together
<<<<<<< HEAD

=======
>>>>>>> origin/full_version_v1
```bash
npm install          # installs concurrently at root
npm run dev          # starts backend (3000) + frontend (3001) simultaneously
```

Or run them separately:
<<<<<<< HEAD

=======
>>>>>>> origin/full_version_v1
```bash
npm run backend      # only the API
npm run frontend     # only the UI
```

### 4 — Seed test data
<<<<<<< HEAD

=======
>>>>>>> origin/full_version_v1
```bash
npm run seed
# Creates demo user: demo.wearaware@gmail.com / WearAware2026!
```

## Tech Stack

<<<<<<< HEAD
| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Backend    | Node.js, TypeScript, Express       |
| Database   | PostgreSQL via Supabase (hosted)   |
| Auth       | Supabase Auth (JWT)                |
=======
| Layer      | Technology |
|------------|------------|
| Backend    | Node.js, TypeScript, Express |
| Database   | PostgreSQL via Supabase (hosted) |
| Auth       | Supabase Auth (JWT) |
>>>>>>> origin/full_version_v1
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
<<<<<<< HEAD

=======
>>>>>>> origin/full_version_v1
```
Email:    demo.wearaware@gmail.com
Password: WearAware2026!
```
<<<<<<< HEAD

# WearAware — Backend API

A sustainable fashion platform backend built with **Node.js + TypeScript + Express + Supabase**.

---

## Project Structure

```
WearAware/
├── src/
│   ├── index.ts                      # Express app entry point
│   ├── config/
│   │   └── supabase.ts               # Supabase client (public + admin)
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT validation via Supabase Auth
│   │   └── validation.middleware.ts   # Zod request validation
│   ├── routes/                        # Route definitions + Zod schemas
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── wardrobe.routes.ts
│   │   ├── sustainability.routes.ts
│   │   ├── matching.routes.ts
│   │   ├── stores.routes.ts
│   │   └── analytics.routes.ts
│   ├── controllers/                   # Business logic handlers
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── wardrobe.controller.ts
│   │   ├── sustainability.controller.ts
│   │   ├── matching.controller.ts
│   │   ├── stores.controller.ts
│   │   └── analytics.controller.ts
│   ├── services/                      # Core domain services
│   │   ├── sustainability.service.ts  # Score engine & deltas
│   │   ├── matching.service.ts        # RTPW matching algorithm
│   │   └── analytics.service.ts       # Wardrobe stats & insights
│   └── types/
│       └── index.ts                   # All shared TypeScript types
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # Full DB schema + RLS policies
        └── 002_helper_functions.sql   # Helper RPCs + seed data
```

---

## Getting Started

### 1. Clone and install dependencies

```bash
cd WearAware
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the **SQL Editor**, run both migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_helper_functions.sql`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values from your Supabase project's **Settings → API** page:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Run in development

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

---

## API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.
Tokens are obtained from `POST /api/auth/login`.

### Auth `/api/auth`

| Method | Path              | Auth | Description                   |
| ------ | ----------------- | ---- | ----------------------------- |
| POST   | `/register`       | –    | Register + create profile     |
| POST   | `/login`          | –    | Login, returns session tokens |
| POST   | `/logout`         | –    | Invalidate session            |
| POST   | `/refresh`        | –    | Refresh access token          |
| POST   | `/reset-password` | –    | Send password reset email     |

### Users `/api/users`

| Method | Path              | Auth | Description               |
| ------ | ----------------- | ---- | ------------------------- |
| GET    | `/me`             | ✓    | Get own profile + score   |
| PATCH  | `/me`             | ✓    | Update profile            |
| GET    | `/:username`      | –    | Public profile            |
| GET    | `/me/connections` | ✓    | Users connected via swaps |

### Wardrobe `/api/wardrobe`

| Method | Path            | Auth | Description                                          |
| ------ | --------------- | ---- | ---------------------------------------------------- |
| GET    | `/`             | ✓    | List all items (filter by category, color, material) |
| POST   | `/`             | ✓    | Add item to wardrobe                                 |
| GET    | `/:id`          | ✓    | Item detail + wear history                           |
| PATCH  | `/:id`          | ✓    | Update item                                          |
| DELETE | `/:id`          | ✓    | Soft-remove item                                     |
| POST   | `/:id/wear`     | ✓    | Log a wear event                                     |
| GET    | `/:id/wear`     | ✓    | Full wear history for item                           |
| GET    | `/stats/recent` | ✓    | Recently & frequently worn items                     |

### Sustainability `/api/sustainability`

| Method | Path        | Auth | Description                              |
| ------ | ----------- | ---- | ---------------------------------------- |
| GET    | `/score`    | ✓    | Current score + grade                    |
| GET    | `/history`  | ✓    | Full score event log                     |
| POST   | `/init`     | ✓    | Compute initial score from wardrobe      |
| POST   | `/advice`   | ✓    | AI advice on a potential new purchase    |
| POST   | `/decision` | ✓    | Record purchase decision (applies delta) |

### Matching `/api/matching`

| Method | Path                  | Auth | Description                          |
| ------ | --------------------- | ---- | ------------------------------------ |
| GET    | `/rtpw`               | ✓    | My ready-to-part-with list           |
| POST   | `/rtpw`               | ✓    | Add item to RTPW                     |
| DELETE | `/rtpw/:id`           | ✓    | Remove from RTPW                     |
| GET    | `/rtpw/all`           | –    | Browse all unmatched RTPW items      |
| GET    | `/wanted`             | ✓    | My wanted items                      |
| POST   | `/wanted`             | ✓    | Add wanted item                      |
| DELETE | `/wanted/:id`         | ✓    | Remove wanted item                   |
| POST   | `/search/:wanted_id`  | ✓    | Find RTPW candidates for wanted item |
| POST   | `/propose`            | ✓    | Create a match proposal              |
| GET    | `/matches`            | ✓    | My pending/active matches            |
| POST   | `/matches/:id/accept` | ✓    | Accept match (boosts both scores)    |
| POST   | `/matches/:id/reject` | ✓    | Reject match                         |

### Partner Stores `/api/stores`

| Method | Path              | Auth | Description                          |
| ------ | ----------------- | ---- | ------------------------------------ |
| GET    | `/`               | ✓    | List stores (filter by city/country) |
| GET    | `/:id`            | –    | Store detail                         |
| POST   | `/donate`         | ✓    | Donate item to a partner store       |
| GET    | `/donations/mine` | ✓    | My donation history                  |
| PATCH  | `/donations/:id`  | ✓    | Update donation status               |

### Analytics `/api/analytics`

| Method | Path           | Auth | Description                                   |
| ------ | -------------- | ---- | --------------------------------------------- |
| GET    | `/wardrobe`    | ✓    | Category/material breakdown, wear trends      |
| GET    | `/score-trend` | ✓    | Score change over time (default last 90 days) |
| GET    | `/insights`    | ✓    | AI sustainability insights & recommendations  |
| GET    | `/summary`     | ✓    | Combined dashboard data (single request)      |

---

## Sustainability Score

Scores range from **0–100** with letter grades (F → A+).

| Event                  | Delta  |
| ---------------------- | ------ |
| Clothing swap          | +12    |
| Donation to store      | +8     |
| Sustainable purchase   | +1–+13 |
| Unsustainable purchase | −3–−8  |
| High wear frequency    | +2     |
| Low wear frequency     | −1     |

The initial score is computed from wardrobe composition (material types, wardrobe size, wear utilisation).

---

## For Your AI Teammate

The following fields are left for the AI/vision module to populate:

- `clothing_items.ai_tags` — array of descriptive tags extracted from clothing images
- `clothing_items.ai_style_summary` — natural language style description
- `purchase_advice_log.ai_verdict` and `ai_reasoning` — can be enhanced with LLM reasoning
- The `matching.service.ts` `scoreCandidate()` function uses basic attribute overlap and can be replaced with an embedding-based similarity search

The `image_urls` on `clothing_items` should point to Supabase Storage URLs uploaded by the frontend/AI pipeline.

---

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (JWT)
- **Validation**: Zod
- **Security**: Helmet, CORS
=======
>>>>>>> origin/full_version_v1
