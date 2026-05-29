-- ─────────────────────────────────────────────────────────────────────────────
-- Helper function: get most frequently worn items for a user
-- Called from the wardrobe /stats/recent endpoint
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function get_frequently_worn_items(p_user_id uuid, p_limit int default 10)
returns table (
  item_id     uuid,
  name        text,
  category    clothing_category,
  color       text,
  image_urls  text[],
  wear_count  bigint,
  last_worn   date
)
language sql stable as $$
  select
    ci.id       as item_id,
    ci.name,
    ci.category,
    ci.color,
    ci.image_urls,
    count(wl.id)      as wear_count,
    max(wl.worn_on)   as last_worn
  from   clothing_items ci
  join   wear_logs      wl on wl.item_id = ci.id
  where  ci.owner_id = p_user_id
    and  ci.is_active = true
    and  wl.user_id   = p_user_id
  group  by ci.id, ci.name, ci.category, ci.color, ci.image_urls
  order  by wear_count desc, last_worn desc
  limit  p_limit;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data: sample partner stores
-- Remove or customise before production
-- ─────────────────────────────────────────────────────────────────────────────
insert into partner_stores (name, description, city, country, commission_pct, contact_email)
values
  ('GreenThread Berlin',   'Curated sustainable fashion in the heart of Mitte.',          'Berlin',    'Germany',  15.00, 'hello@greenthread.de'),
  ('Second Stitch London', 'Pre-loved clothes given a second life in Shoreditch.',        'London',    'UK',       12.50, 'info@secondstitch.co.uk'),
  ('Closet Cycle NYC',     'Community-run clothing exchange in Brooklyn.',                'New York',  'USA',      18.00, 'closetcycle@nyc.com'),
  ('Remake Amsterdam',     'Vintage and upcycled fashion boutique.',                     'Amsterdam', 'Netherlands', 14.00, 'shop@remake.nl'),
  ('Rewear Paris',         'Sustainable fashion hub on the Left Bank.',                  'Paris',     'France',   16.00, 'bonjour@rewear.fr')
on conflict do nothing;
