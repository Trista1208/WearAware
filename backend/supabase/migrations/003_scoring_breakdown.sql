-- =============================================================
-- Migration 003 – Custom scoring breakdown storage
-- =============================================================

-- Store the full score breakdown as JSON so the frontend can
-- render a transparent, per-penalty explanation to the user.
alter table sustainability_scores
  add column if not exists breakdown jsonb,
  add column if not exists items_analysed int default 0;

-- Drop the old Postgres-based initial score function.
-- Score computation is now handled entirely in TypeScript
-- for full transparency and testability.
drop function if exists compute_initial_sustainability_score(uuid);
