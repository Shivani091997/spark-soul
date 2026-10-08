-- =============================================================
--  SPARK SOUL — UPDATE 1: up to 3 photos per product + bulk price
--  Paste into Supabase → SQL Editor → Run. Safe to run more than once.
-- =============================================================
alter table public.products
  add column if not exists images     jsonb not null default '[]'::jsonb,   -- up to 3 photos: [{ "url": …, "path": … }]
  add column if not exists bulk_price numeric(10,2) check (bulk_price >= 0), -- price per piece for bulk orders (empty = no bulk price)
  add column if not exists bulk_min   integer not null default 12 check (bulk_min >= 2); -- minimum pieces for the bulk price

-- copy any existing single photo into the new photo list
update public.products
set images = jsonb_build_array(jsonb_build_object('url', image_url, 'path', image_path))
where image_url is not null and images = '[]'::jsonb;
