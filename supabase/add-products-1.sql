-- =============================================================
--  SPARK SOUL — ADD FIRST 6 PRODUCTS
--  Paste into Supabase → SQL Editor → Run.
--  Safe to run twice: a product that already exists (same name) is skipped.
--  Photos are stored on the website: assets/products/
-- =============================================================
with base as (select 'https://shivani091997.github.io/spark-soul/assets/products/'::text as u),
v (sort_order, name, category, price, bulk_price, description, files) as (values
  (1, 'Sheesha Braid Hair Strands (Set of 5)', 'Hair Accessories', 280, 250,
   'A set of 5 hand-braided thread strands with sparkling mirror (sheesha) work, tiny gold beads and a glass drop at the end. Each strand clips in on a pin, so you can wear one or all five. Colours: purple, yellow, blue, red and green. Lovely for garba, mehndi, haldi and festive looks.',
   array['p1-1.jpg','p1-2.jpg','p1-3.jpg']),
  (2, 'Rainbow Blossom Hair Strands (Set of 5)', 'Hair Accessories', 300, 280,
   'A set of 5 multicolour braided strands, each topped with a little flower charm and finished with a soft tassel. They clip in on pins and add instant colour to open hair or a braid. Fun for festivals, college events and everyday boho style.',
   array['p2-1.jpg','p2-2.jpg','p2-3.jpg']),
  (3, 'Sheesha Jhoomar Hair Band', 'Hair Accessories', 420, 340,
   'Five mirror-work braided strands joined on a mirror-studded band, finished with tassels in black, blue, red, yellow and purple. Tie it across the back of your hair for a ready festive look in seconds. Perfect for Navratri, weddings and traditional outfits.',
   array['p3-1.jpg','p3-2.jpg','p3-3.jpg']),
  (4, 'Boho Coin Braided Phone Sling', 'Mobile Slings', 200, 180,
   'A hand-braided crossbody phone strap with antique coin charms, little shell beads and a tassel. Wear your phone hands-free with a sturdy metal hook that clips onto your phone case. Colours: teal, red-white, mustard and pink.',
   array['p4-1.jpg','p4-2.jpg']),
  (5, 'Two-Tone Braided Phone Sling', 'Mobile Slings', 180, 150,
   'A classic two-colour braided crossbody phone strap with a soft tassel and metal hook. Light, comfortable and easy to style every day. Colours: blue, wine, green, pink and maroon.',
   array['p5-1.jpg','p5-2.jpg']),
  (6, 'Chunky Braid Phone Sling', 'Mobile Slings', 180, 150,
   'A thick, soft chunky-braid crossbody phone strap with a strong metal hook. The pastel rainbow one comes with an evil-eye charm. Bold and comfy for everyday use. Colours: pastel rainbow, navy-white and blue-sky-white.',
   array['p6-1.jpg','p6-2.jpg'])
)
insert into public.products
  (name, category, price, bulk_price, bulk_min, description, images, image_url, image_path, in_stock, featured, sort_order)
select
  v.name, v.category, v.price, v.bulk_price, 12, v.description,
  (select jsonb_agg(jsonb_build_object('url', base.u || f, 'path', null) order by n)
     from unnest(v.files) with ordinality as t(f, n)),
  base.u || v.files[1], null, true, false, v.sort_order
from v, base
where not exists (select 1 from public.products p where p.name = v.name);
