-- Sunset Design schema
-- Applied manually to Supabase (not auto-migrated)

-- Boards (rooms)
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cover_image_url text,
  budget_eur numeric,
  area_sqm numeric,
  orientation text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Pins (saved items)
create table if not exists pins (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  image_url text not null,
  source_url text not null default '',
  store_name text,
  product_name text,
  price_eur numeric,
  dimensions jsonb,
  notes text,
  status text not null default 'wishlist'
    check (status in ('wishlist', 'shortlisted', 'ordered', 'arrived', 'installed', 'rejected')),
  price_currency text not null default 'EUR'
    check (price_currency in ('EUR', 'USD')),
  exchange_rate numeric,
  requires_vpn boolean not null default false,
  page_snapshot_url text,
  cached_product_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pin tags (many-to-many)
create table if not exists pin_tags (
  pin_id uuid not null references pins(id) on delete cascade,
  tag text not null,
  primary key (pin_id, tag)
);

-- Indexes
create index if not exists idx_pins_board_id on pins(board_id);
create index if not exists idx_pins_status on pins(status);
create index if not exists idx_pin_tags_tag on pin_tags(tag);

-- Seed the 8 room boards
insert into boards (name, slug, budget_eur, area_sqm, orientation, sort_order) values
  ('Living & Dining', 'living-dining', null, 45.81, 'west', 1),
  ('Kitchen', 'kitchen', null, 7.37, 'interior', 2),
  ('Primary Bedroom', 'primary-bedroom', null, 17.06, 'north', 3),
  ('Guest Bedroom', 'guest-bedroom', null, 14.90, 'north', 4),
  ('Bathrooms', 'bathrooms', null, 10.79, null, 5),
  ('Terrace', 'terrace', null, 60.83, 'east', 6),
  ('Entry & Hallway', 'entry-hallway', null, 8.05, 'interior', 7),
  ('General Inspo', 'general-inspo', null, null, null, 8)
on conflict (slug) do nothing;

-- Inspo images (Mood Board)
create table if not exists inspo_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  source_url text,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: allow all access (no auth)
alter table inspo_images enable row level security;
create policy "Allow all" on inspo_images for all using (true) with check (true);

-- App settings (key-value store for master budget, currency preference, etc.)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null
);

alter table app_settings enable row level security;
create policy "Allow all" on app_settings for all using (true) with check (true);
