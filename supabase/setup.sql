-- =============================================================
--  SPARK SOUL — DATABASE SETUP
--  Paste this whole file into Supabase → SQL Editor → Run.
--  Safe to run more than once.
-- =============================================================

-- 1. Products table ------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  price       numeric(10,2) not null check (price >= 0),
  category    text not null default 'Mobile Slings',
  image_url   text,
  image_path  text,               -- file path inside storage, used to delete old photos
  images      jsonb not null default '[]'::jsonb,   -- up to 3 photos: [{ url, path }]
  bulk_price  numeric(10,2) check (bulk_price >= 0), -- price per piece for bulk orders (empty = none)
  bulk_min    integer not null default 12 check (bulk_min >= 2),
  in_stock    boolean not null default true,
  featured    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- 1b. Columns added later (for databases created before them)
alter table public.products
  add column if not exists images     jsonb not null default '[]'::jsonb,
  add column if not exists bulk_price numeric(10,2) check (bulk_price >= 0),
  add column if not exists bulk_min   integer not null default 12 check (bulk_min >= 2);

-- 2. Admins (only emails listed here can edit products) ------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;  -- nobody can read this list from the website

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 3. Product permissions: everyone can view, only admins can change -
alter table public.products enable row level security;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
  on public.products for select
  using (true);

drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
  on public.products for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can edit products" on public.products;
create policy "Admins can edit products"
  on public.products for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (public.is_admin());

-- 3b. Data API access (needed when "Automatically expose new tables" is switched off)
--     The website (anon) may only READ products. Logged-in users may also change them,
--     but the policies above still allow that only for emails in the admins list.
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
revoke all on public.admins from anon, authenticated;            -- the admin list is never readable from outside
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 4. Photo storage (public bucket: anyone can see photos, only admins upload)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Admins can list product images" on storage.objects;
create policy "Admins can list product images"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can replace product images" on storage.objects;
create policy "Admins can replace product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- 5. Make YOURSELF the admin ---------------------------------------
--    Change the email below to the one you created in
--    Authentication → Users, then run this line.
insert into public.admins (email) values ('your-email@example.com')
on conflict do nothing;
