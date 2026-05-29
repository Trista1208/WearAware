-- =============================================================
-- WearAware – Initial Database Schema
-- Run in Supabase SQL Editor (or via Supabase CLI migrations)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fuzzy text search for matching

-- ─────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────────────────────
create type gender_type        as enum ('male', 'female', 'non_binary', 'prefer_not_to_say');
create type clothing_category  as enum (
  'tops', 'bottoms', 'dresses', 'outerwear', 'footwear',
  'accessories', 'underwear', 'sportswear', 'formalwear', 'other'
);
create type clothing_condition as enum ('new', 'like_new', 'good', 'fair', 'worn');
create type material_type      as enum (
  'cotton', 'wool', 'silk', 'linen', 'polyester', 'nylon',
  'acrylic', 'viscose', 'denim', 'leather', 'synthetic_blend',
  'natural_blend', 'other'
);
create type match_status       as enum ('pending', 'accepted', 'rejected', 'completed', 'expired');
create type donation_status    as enum ('pending', 'received', 'listed', 'sold', 'unsold');
create type score_event_type   as enum (
  'wardrobe_init',
  'purchase_sustainable',
  'purchase_unsustainable',
  'clothing_swap',
  'store_donation',
  'high_wear_frequency',
  'low_wear_frequency',
  'manual_adjustment'
);

-- ─────────────────────────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id                uuid        primary key references auth.users (id) on delete cascade,
  username          text        unique not null,
  display_name      text,
  avatar_url        text,
  age               int         check (age >= 13 and age <= 120),
  gender            gender_type,
  location_city     text,
  location_country  text,
  bio               text,
  style_tags        text[]      default '{}',  -- e.g. {'minimalist','streetwear','vintage'}
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- CLOTHING ITEMS  (catalogue entries – shared across users)
-- ─────────────────────────────────────────────────────────────
create table clothing_items (
  id                uuid              primary key default uuid_generate_v4(),
  owner_id          uuid              not null references profiles (id) on delete cascade,
  name              text              not null,
  brand             text,
  category          clothing_category not null,
  sub_category      text,
  color             text,
  secondary_colors  text[]            default '{}',
  material          material_type,
  material_details  text,             -- e.g. "80% cotton 20% polyester"
  condition         clothing_condition not null default 'good',
  purchase_year     int,
  purchase_price    numeric(10,2),
  image_urls        text[]            default '{}',  -- Supabase Storage URLs
  ai_tags           text[]            default '{}',  -- populated by AI teammate
  ai_style_summary  text,                            -- populated by AI teammate
  is_active         boolean           default true,  -- false = removed from wardrobe
  notes             text,
  created_at        timestamptz       default now(),
  updated_at        timestamptz       default now()
);

create index idx_clothing_items_owner    on clothing_items (owner_id);
create index idx_clothing_items_category on clothing_items (category);
create index idx_clothing_items_active   on clothing_items (is_active);

-- ─────────────────────────────────────────────────────────────
-- WEAR LOGS  (tracks each time a user wears an item)
-- ─────────────────────────────────────────────────────────────
create table wear_logs (
  id          uuid        primary key default uuid_generate_v4(),
  item_id     uuid        not null references clothing_items (id) on delete cascade,
  user_id     uuid        not null references profiles (id) on delete cascade,
  worn_on     date        not null default current_date,
  occasion    text,       -- e.g. "work", "casual", "gym"
  created_at  timestamptz default now()
);

create index idx_wear_logs_item    on wear_logs (item_id);
create index idx_wear_logs_user    on wear_logs (user_id);
create index idx_wear_logs_worn_on on wear_logs (worn_on desc);

-- ─────────────────────────────────────────────────────────────
-- SUSTAINABILITY SCORES  (one current row per user)
-- ─────────────────────────────────────────────────────────────
create table sustainability_scores (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        unique not null references profiles (id) on delete cascade,
  score       numeric(5,2) not null default 50.00 check (score >= 0 and score <= 100),
  grade       char(2)     generated always as (
                case
                  when score >= 85 then 'A+'
                  when score >= 75 then 'A'
                  when score >= 65 then 'B+'
                  when score >= 55 then 'B'
                  when score >= 45 then 'C+'
                  when score >= 35 then 'C'
                  when score >= 25 then 'D'
                  else 'F'
                end
              ) stored,
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────
-- SUSTAINABILITY EVENTS  (immutable audit log of score changes)
-- ─────────────────────────────────────────────────────────────
create table sustainability_events (
  id            uuid              primary key default uuid_generate_v4(),
  user_id       uuid              not null references profiles (id) on delete cascade,
  event_type    score_event_type  not null,
  delta         numeric(5,2)      not null,   -- positive = boost, negative = penalty
  score_before  numeric(5,2)      not null,
  score_after   numeric(5,2)      not null,
  reference_id  uuid,             -- e.g. clothing_item id, match id, donation id
  description   text,
  created_at    timestamptz       default now()
);

create index idx_sustainability_events_user on sustainability_events (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- READY TO PART WITH  (items a user wants to give/swap away)
-- ─────────────────────────────────────────────────────────────
create table ready_to_part_with (
  id          uuid        primary key default uuid_generate_v4(),
  item_id     uuid        unique not null references clothing_items (id) on delete cascade,
  user_id     uuid        not null references profiles (id) on delete cascade,
  preference  text[]      default '{}',  -- e.g. {'swap','donate','sell'}
  notes       text,
  is_matched  boolean     default false,
  added_at    timestamptz default now()
);

create index idx_rtpw_user      on ready_to_part_with (user_id);
create index idx_rtpw_matched   on ready_to_part_with (is_matched);

-- ─────────────────────────────────────────────────────────────
-- WANTED ITEMS  (items a user is looking for)
-- ─────────────────────────────────────────────────────────────
create table wanted_items (
  id              uuid              primary key default uuid_generate_v4(),
  user_id         uuid              not null references profiles (id) on delete cascade,
  category        clothing_category,
  description     text              not null,
  preferred_brands text[]           default '{}',
  preferred_colors text[]           default '{}',
  size_notes      text,
  is_fulfilled    boolean           default false,
  created_at      timestamptz       default now()
);

create index idx_wanted_user on wanted_items (user_id);

-- ─────────────────────────────────────────────────────────────
-- CLOTHING MATCHES  (AI-assisted pairings between users)
-- ─────────────────────────────────────────────────────────────
create table clothing_matches (
  id                uuid         primary key default uuid_generate_v4(),
  offering_item_id  uuid         not null references ready_to_part_with (id) on delete cascade,
  wanted_item_id    uuid         references wanted_items (id) on delete set null,
  offering_user_id  uuid         not null references profiles (id) on delete cascade,
  receiving_user_id uuid         not null references profiles (id) on delete cascade,
  match_score       numeric(5,2),  -- 0–100 compatibility score
  status            match_status   default 'pending',
  matched_at        timestamptz    default now(),
  resolved_at       timestamptz,
  notes             text
);

create index idx_matches_offering_user  on clothing_matches (offering_user_id);
create index idx_matches_receiving_user on clothing_matches (receiving_user_id);
create index idx_matches_status         on clothing_matches (status);

-- ─────────────────────────────────────────────────────────────
-- USER CONNECTIONS  (established after a swap is completed)
-- ─────────────────────────────────────────────────────────────
create table user_connections (
  id          uuid        primary key default uuid_generate_v4(),
  user_a_id   uuid        not null references profiles (id) on delete cascade,
  user_b_id   uuid        not null references profiles (id) on delete cascade,
  match_id    uuid        references clothing_matches (id) on delete set null,
  connected_at timestamptz default now(),
  unique (user_a_id, user_b_id)
);

create index idx_connections_user_a on user_connections (user_a_id);
create index idx_connections_user_b on user_connections (user_b_id);

-- ─────────────────────────────────────────────────────────────
-- PARTNER STORES  (local second-hand stores)
-- ─────────────────────────────────────────────────────────────
create table partner_stores (
  id              uuid        primary key default uuid_generate_v4(),
  name            text        not null,
  description     text,
  address         text,
  city            text        not null,
  country         text        not null,
  latitude        float8,
  longitude       float8,
  contact_email   text,
  contact_phone   text,
  website_url     text,
  commission_pct  numeric(5,2) not null default 15.00 check (commission_pct >= 0 and commission_pct <= 100),
  is_active       boolean      default true,
  created_at      timestamptz  default now()
);

create index idx_partner_stores_city    on partner_stores (city);
create index idx_partner_stores_active  on partner_stores (is_active);

-- ─────────────────────────────────────────────────────────────
-- STORE DONATIONS  (items donated to partner stores)
-- ─────────────────────────────────────────────────────────────
create table store_donations (
  id              uuid             primary key default uuid_generate_v4(),
  user_id         uuid             not null references profiles (id) on delete cascade,
  store_id        uuid             not null references partner_stores (id) on delete cascade,
  item_id         uuid             not null references clothing_items (id) on delete cascade,
  status          donation_status  default 'pending',
  listed_price    numeric(10,2),
  sold_price      numeric(10,2),
  platform_revenue numeric(10,2)  generated always as (
                    case when sold_price is not null
                    then sold_price * 0.15   -- placeholder, actual commission fetched from store
                    else null end
                  ) stored,
  donated_at      timestamptz      default now(),
  sold_at         timestamptz
);

create index idx_donations_user  on store_donations (user_id);
create index idx_donations_store on store_donations (store_id);
create index idx_donations_status on store_donations (status);

-- ─────────────────────────────────────────────────────────────
-- PURCHASE ADVICE LOG  (records of AI advice requests)
-- ─────────────────────────────────────────────────────────────
create table purchase_advice_log (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references profiles (id) on delete cascade,
  item_description text,
  image_url       text,
  ai_verdict      text,        -- 'recommended' | 'not_recommended' | 'neutral'
  ai_reasoning    text,
  sustainability_impact numeric(5,2),  -- estimated delta if purchased
  user_decision   text,        -- 'purchased' | 'skipped' | null (no answer yet)
  created_at      timestamptz  default now()
);

create index idx_advice_log_user on purchase_advice_log (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS – auto-update updated_at
-- ─────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_clothing_items_updated_at
  before update on clothing_items
  for each row execute function set_updated_at();

create trigger trg_sustainability_scores_updated_at
  before update on sustainability_scores
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- FUNCTION – apply sustainability score delta
-- Central function so score never goes out of [0,100]
-- ─────────────────────────────────────────────────────────────
create or replace function apply_sustainability_delta(
  p_user_id     uuid,
  p_event_type  score_event_type,
  p_delta       numeric,
  p_reference_id uuid default null,
  p_description text  default null
)
returns numeric language plpgsql as $$
declare
  v_old_score  numeric;
  v_new_score  numeric;
begin
  select score into v_old_score
  from   sustainability_scores
  where  user_id = p_user_id
  for update;

  if not found then
    insert into sustainability_scores (user_id, score) values (p_user_id, 50.00);
    v_old_score := 50.00;
  end if;

  v_new_score := greatest(0, least(100, v_old_score + p_delta));

  update sustainability_scores
  set    score = v_new_score
  where  user_id = p_user_id;

  insert into sustainability_events
    (user_id, event_type, delta, score_before, score_after, reference_id, description)
  values
    (p_user_id, p_event_type, p_delta, v_old_score, v_new_score, p_reference_id, p_description);

  return v_new_score;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- FUNCTION – compute initial score from wardrobe
-- Called once after a user finishes uploading their wardrobe
-- ─────────────────────────────────────────────────────────────
create or replace function compute_initial_sustainability_score(p_user_id uuid)
returns numeric language plpgsql as $$
declare
  v_total_items      int;
  v_natural_items    int;
  v_synthetic_items  int;
  v_worn_recently    int;  -- worn in last 90 days
  v_base_score       numeric := 50.0;
  v_delta            numeric := 0.0;
begin
  select count(*) into v_total_items
  from   clothing_items
  where  owner_id = p_user_id and is_active = true;

  select count(*) into v_natural_items
  from   clothing_items
  where  owner_id = p_user_id and is_active = true
    and  material in ('cotton','wool','silk','linen');

  select count(*) into v_synthetic_items
  from   clothing_items
  where  owner_id = p_user_id and is_active = true
    and  material in ('polyester','nylon','acrylic');

  select count(distinct item_id) into v_worn_recently
  from   wear_logs
  where  user_id = p_user_id
    and  worn_on >= current_date - interval '90 days';

  -- Reward natural fabrics
  if v_total_items > 0 then
    v_delta := v_delta + (v_natural_items::numeric / v_total_items) * 15;
    -- Penalise synthetics
    v_delta := v_delta - (v_synthetic_items::numeric / v_total_items) * 10;
  end if;

  -- Reward wardrobe utilisation (worn items / total items)
  if v_total_items > 0 and v_worn_recently > 0 then
    v_delta := v_delta + least(10, (v_worn_recently::numeric / v_total_items) * 20);
  end if;

  -- Penalise very large wardrobes (overconsumption signal)
  if v_total_items > 100 then
    v_delta := v_delta - 10;
  elsif v_total_items > 60 then
    v_delta := v_delta - 5;
  end if;

  v_delta := greatest(-45, least(45, v_delta));

  perform apply_sustainability_delta(
    p_user_id, 'wardrobe_init', v_delta, null,
    format('Initial score computed from %s wardrobe items', v_total_items)
  );

  return v_base_score + v_delta;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table profiles                enable row level security;
alter table clothing_items          enable row level security;
alter table wear_logs               enable row level security;
alter table sustainability_scores   enable row level security;
alter table sustainability_events   enable row level security;
alter table ready_to_part_with      enable row level security;
alter table wanted_items            enable row level security;
alter table clothing_matches        enable row level security;
alter table user_connections        enable row level security;
alter table partner_stores          enable row level security;
alter table store_donations         enable row level security;
alter table purchase_advice_log     enable row level security;

-- Profiles: public read, owner write
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_insert_own"  on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);
create policy "profiles_delete_own"  on profiles for delete using (auth.uid() = id);

-- Clothing items: public read of active items, owner full access
create policy "items_select_active"  on clothing_items for select using (is_active = true or auth.uid() = owner_id);
create policy "items_insert_own"     on clothing_items for insert with check (auth.uid() = owner_id);
create policy "items_update_own"     on clothing_items for update using (auth.uid() = owner_id);
create policy "items_delete_own"     on clothing_items for delete using (auth.uid() = owner_id);

-- Wear logs: owner only
create policy "wear_logs_owner"      on wear_logs for all using (auth.uid() = user_id);

-- Sustainability: owner read, system write (service role)
create policy "scores_select_own"    on sustainability_scores for select using (auth.uid() = user_id);
create policy "events_select_own"    on sustainability_events for select using (auth.uid() = user_id);

-- Ready to part with: owner write, public read (for matching)
create policy "rtpw_select_all"      on ready_to_part_with for select using (true);
create policy "rtpw_owner_write"     on ready_to_part_with for insert with check (auth.uid() = user_id);
create policy "rtpw_owner_update"    on ready_to_part_with for update using (auth.uid() = user_id);
create policy "rtpw_owner_delete"    on ready_to_part_with for delete using (auth.uid() = user_id);

-- Wanted items: owner write, public read
create policy "wanted_select_all"    on wanted_items for select using (true);
create policy "wanted_owner_write"   on wanted_items for insert with check (auth.uid() = user_id);
create policy "wanted_owner_update"  on wanted_items for update using (auth.uid() = user_id);
create policy "wanted_owner_delete"  on wanted_items for delete using (auth.uid() = user_id);

-- Matches: parties involved can see their own matches
create policy "matches_select_party" on clothing_matches for select
  using (auth.uid() = offering_user_id or auth.uid() = receiving_user_id);

-- Connections: both users can see
create policy "connections_select"   on user_connections for select
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- Partner stores: public read
create policy "stores_select_all"    on partner_stores for select using (true);

-- Donations: owner only
create policy "donations_owner"      on store_donations for all using (auth.uid() = user_id);

-- Purchase advice: owner only
create policy "advice_owner"         on purchase_advice_log for all using (auth.uid() = user_id);
