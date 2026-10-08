# Spark Soul — Website

Handmade mobile slings & hair accessories. Free website on **GitHub Pages**, products stored in a free **Supabase** database, orders through **WhatsApp**.

| Page | What it's for |
|---|---|
| `index.html` | Your one-page shop: banner, about me, products, and a WhatsApp button |
| `admin.html` | Your private admin page. Log in to add, edit and delete products and upload photos |

---

## One-time setup (about 20 minutes)

### Step 1 — Create the free database (Supabase)
1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub.
2. Click **New project**. Name it `spark-soul-story`, choose a strong database password (save it somewhere), pick the region closest to you (e.g. **Mumbai**), and choose the **Free** plan.
3. Wait about 2 minutes for it to finish setting up.

### Step 2 — Create your admin login
1. In Supabase, open **Authentication → Users → Add user → Create new user**.
2. Enter your email and a password. Tick **Auto Confirm User**. This is what you'll use to log in to `admin.html`.
3. Go to **Authentication → Sign In / Providers** and turn **OFF** "Allow new users to sign up". Then nobody else can create an account.

### Step 3 — Create the products table
1. Open `supabase/setup.sql` from this folder and change `your-email@example.com` at the bottom to the email from Step 2.
2. In Supabase, open **SQL Editor → New query**, paste the whole file, and click **Run**. You should see "Success".

### Step 4 — Connect the website to the database
1. In Supabase, open **Project Settings → API Keys** (also shown under **Connect**).
2. Copy the **Project URL** and the **publishable key** (older projects call it the **anon public** key).
3. Open `js/config.js` and paste them into `supabaseUrl` and `supabaseKey`.
4. While you're there, set your **WhatsApp number** (country code + number, digits only, e.g. `919876543210`) and your **Instagram** link.

> ⚠️ Never put the **secret** / **service_role** key in this file. The publishable key is designed to be public. Your data is protected by the rules in `setup.sql`, so only your admin email can change products.

### Step 5 — Put it online (GitHub Pages)
1. Create a new **public** repository on GitHub, e.g. `spark-soul-story`.
2. Upload all the files in this folder to it (Claude can do this for you).
3. In the repository, go to **Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save**.
4. After about a minute your shop is live at `https://YOUR-USERNAME.github.io/spark-soul-story/`.
5. Your admin page is the same address followed by `admin.html`.

### Step 6 — Add your products
Open the admin page, log in, and click **+ Add product**. Photos are shrunk automatically before upload.

---

## Everyday use
- **New product:** admin page → **+ Add product**
- **Sold out:** admin page → **Mark sold out**. The piece stays visible with a "Sold out" badge and an "Ask for a restock" button.
- **Show first:** tick **Show first** to put a piece at the top of the product list.
- **Photos:** square photos look best.
- **Banner photo:** the banner shows a drawn illustration. To use your own photo, save it as `assets/hero.jpg` and set `heroImage: "assets/hero.jpg"` in `js/config.js`.
- **About me text:** edit the two paragraphs in the "About Me" section of `index.html`.
- **Logos:** `assets/logo.png` (Spark Soul), `assets/seal.png` (Truly Grateful seal), `assets/signature.png` (Shivani Patidar). The originals are in `assets/originals/`.
- **Colours:** change the colour values at the top of `css/style.css`.

## Good to know
- **Free limits:** Supabase Free gives you 500 MB of database space and 1 GB of photo storage, which is thousands of products.
- **Inactivity pause:** Supabase pauses free projects after about 7 days with **no activity at all**. Visits to your shop count as activity. If it does pause, log in to supabase.com and click **Restore project**.
- **Custom domain:** you can connect a domain like `sparksoulstory.in` later in GitHub **Settings → Pages → Custom domain**.

## Preview on your computer
Run the following in this folder, then open http://localhost:5500:
```bash
npx http-server -p 5500 -c-1
```
