# Go Hargeisa

A production-ready tourism platform for Hargeisa, Somaliland — built with Next.js 14 (App
Router), TypeScript, Tailwind CSS, Supabase and Framer Motion. Supports English, Arabic (RTL)
and Af-Soomaali, with dark mode, an interactive map, a full admin CMS, and a real content model
for hotels, restaurants, cafes, attractions, events and a blog.

> **Build verification note:** this project was developed in a sandboxed environment with no
> network access, so `npm install` was never actually run here — every file was reviewed by hand
> for type-correctness, import correctness, brace/paren balance, and Next.js App Router / Server
> Component rules (see §10 for the specific checks performed). Run a real `npm install && npm run
> build` before deploying — see §8 for a CI workflow that does this automatically on every push.

---

## 1. What's included

**Public site** — homepage (animated hero, trust stats, destinations, hotels, restaurants,
cafes, attractions, events, local experiences, featured businesses, blog, interactive map,
newsletter), Hotels/Restaurants/Cafes/Attractions (list with working `?q=` search + detail pages
with gallery, breadcrumbs, map, amenities/menu, reviews, review submission, favorite toggle, "Add
to Trip"), Events (filterable list + detail), Blog (Markdown articles), Travel Guide, Shopping,
Transportation, Explore (neighborhoods), About, Contact (real Supabase-backed form).

**Authentication** — Supabase email/password login & registration with email confirmation,
signed-in state resolved client-side in the header (avatar, name, sign out) so public pages stay
statically generated (see §7 on this trade-off), `?next=` redirect support, auth callback route.

**User dashboard** (`/dashboard`, protected by a real server-side auth guard):
- **Favorites** — real heart-toggle on every listing card, backed by the `favorites` table
- **Saved Trips** — create/delete trips, add/remove places, expandable item lists
- **My Reviews** — full history of reviews you've written, with delete
- **Profile** — editable name + avatar photo (uploads to the `avatars` Storage bucket)

**Admin CMS** (`/admin`, protected by a real server-side admin-role guard) — complete CRUD for
all six content types, each with a list view (search-free table, edit, delete) and Add/Edit forms
with Supabase Storage image upload:
- Hotels, Restaurants, Cafes, Attractions, Events, Blog Articles
- **Manage Users** — view all accounts, change roles (user / business owner / admin)

**Database** — 20-table Postgres schema (`supabase/schema.sql`) with Row Level Security on every
table: public read access to published content, admin-only writes, owners can edit their own
listings, users manage their own reviews/favorites/trips/profile. Two Storage buckets
(`listing-images` admin-only, `avatars` per-user-folder) with matching RLS policies. A seed
script pushes sample data into a freshly connected project.

**i18n** — `next-intl`, instant switching between English / Arabic (RTL) / Af-Soomaali. The
language switcher uses a real Somaliland flag SVG (`public/flags/somaliland.svg`) — Unicode has
no emoji flag for Somaliland, and this app never substitutes Somalia's flag for it.

**SEO** — per-page metadata with correct per-locale canonical URLs (see §10), Open Graph/Twitter
cards, JSON-LD (Hotel, TouristDestination, BreadcrumbList), dynamic `sitemap.xml` built from real
data, `robots.txt` disallowing `/admin`, `/dashboard`, `/auth`, plus `noindex` on those sections
via route-segment layouts as a second line of defense.

**PWA** — manifest, service worker, installable icons.

**Performance** — see §7 for the public/authenticated client split that makes public pages
eligible for static generation + hourly ISR, and `React.cache()` deduping repeated Supabase reads
within a single request (e.g. `generateMetadata` + the page component both reading the same
listing).

All public pages read through `lib/data/*.ts`, which queries Supabase when configured and
transparently falls back to `lib/mock-data.ts` only when no project is connected — so the app
runs immediately for preview, but nothing in the actual page code depends on placeholder data.
Every image everywhere is a single `coverImage`/`image` string field, either a labeled on-brand
placeholder (`lib/placeholder-image.ts`, swappable in one line) or a real Supabase Storage URL
uploaded through the admin panel — there's no hardcoded image anywhere outside those two paths.

---

## 2. Prerequisites

- Node.js 20 (pinned in `.nvmrc`)
- npm 9+
- A free [Supabase](https://supabase.com) account

---

## 3. Run it locally

```bash
npm install
cp .env.example .env.local
# Leave the Supabase values blank for now — the site runs on placeholder
# data until you connect a project (see §4).
npm run dev
```

Open `http://localhost:3000` — you'll be redirected to `/en`. Try `/ar` and `/so` to see Arabic
(RTL) and Af-Soomaali.

---

## 4. Connect Supabase (real data, auth, uploads)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run **`supabase/schema.sql`** — creates all 20 tables, enums, indexes,
   triggers (auto-syncing listing ratings from reviews), RLS policies, and the two Storage
   buckets (`listing-images`, `avatars`) with their policies.
3. Copy your `Project URL`, `anon public` key, and `service_role` key from **Settings → API**
   into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Seed sample data: `npm run seed`.
5. Restart the dev server — the site now reads and writes real data everywhere.
6. Make yourself an admin so you can access `/admin`:
   ```sql
   update profiles set role = 'admin' where id = '<your auth.users id>';
   ```
7. (Optional) In **Authentication → URL Configuration**, add
   `https://yourdomain.com/*/auth/callback` as a redirect URL for email confirmations to work in
   production.

### Regenerating types

`types/database.ts` is hand-written to match `schema.sql` exactly. Once your schema is final,
replace it with generated types:
```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.ts
```

---

## 5. Project structure

```
app/[locale]/
  layout.tsx            # fonts, <html lang/dir>, providers — deliberately does NOT read
                         # cookies/auth, so it doesn't force every page dynamic (see §7)
  page.tsx               # homepage
  hotels|restaurants|cafes|attractions/
    page.tsx               # listing + ?q= search, ISR revalidate=3600
    [slug]/page.tsx          # detail: breadcrumbs, reviews, review form, favorite, add-to-trip
  events|blog/              # list + [slug] detail
  admin/
    layout.tsx              # noindex for the whole section
    page.tsx                # overview + stats
    users/page.tsx           # role management
    hotels|restaurants|cafes|attractions|events|articles/
      page.tsx                 # list (AdminListTable) + delete
      new/page.tsx              # create form + image upload
      [id]/edit/page.tsx        # edit form + image upload
  dashboard/
    layout.tsx              # noindex
    page.tsx                # fetches favorites/trips/reviews/profile, renders DashboardTabs
  auth/login|register|callback/
components/
  layout/     # header (client-side auth via useHeaderUser), footer, language switcher, user menu
  home/       # homepage sections
  admin/      # AdminListTable, form-shared (Field/TagInput), one *-form.tsx per content type
  dashboard/  # DashboardTabs, SavedTripsPanel, ReviewsPanel, ProfilePanel
  shared/     # gallery, reviews, review form, listing card (favorite toggle), search box,
              # breadcrumbs, image uploader, delete button, add-to-trip button, flag icon
  map/        # Leaflet map (dynamically imported, no SSR)
lib/
  supabase/   # server.ts (cookie-aware, for auth-dependent reads/writes), public.ts
              # (no cookies — for public content, enables ISR), client.ts (browser), storage.ts
              # (uploads), guards.ts (requireUser/requireAdmin), middleware.ts, is-configured.ts
  data/       # one file per content type — queries Supabase (public client for public content,
              # server client for user-specific data), falls back to mock-data.ts otherwise.
              # getXBySlug functions are wrapped in React.cache() to dedupe per-request calls.
  actions/    # server actions: admin CRUD, content (newsletter/contact/reviews), favorites,
              # trips, profile, users
  i18n/       # next-intl config — includes the Somaliland flag asset reference
  placeholder-image.ts / mock-data.ts
supabase/schema.sql   # full schema + RLS + Storage policies
scripts/seed.ts
.github/workflows/ci.yml   # type-check, lint, build on every push/PR
```

---

## 6. Adding a language string

Add the same key to `messages/en.json`, `ar.json`, `so.json`, then `useTranslations()` (works in
both Server and Client Components with next-intl v3) or `getTranslations()`.

---

## 7. Performance architecture — read this before changing data fetching

Two Supabase clients exist on purpose:

- **`lib/supabase/public.ts`** (`createPublicClient`) — no cookies, used by every `lib/data/*.ts`
  function that reads public content (hotels, restaurants, cafes, attractions, events, articles,
  destinations, map points). Because it never calls `cookies()`, pages using only this client are
  eligible for static generation and the `export const revalidate = 3600` (hourly ISR) set on
  every public listing/detail page.
- **`lib/supabase/server.ts`** (`createClient`) — cookie-aware, used only where the signed-in
  user's identity actually matters: favorites, saved trips, review history, profile, admin
  writes, auth guards. These routes are correctly dynamic (personalized), and that's fine.

**The layout does not check auth server-side.** `app/[locale]/layout.tsx` used to fetch the
signed-in user via the cookie-aware client to show the right header state — but since a layout
wraps every page, that one call forced the *entire site* into full SSR on every request,
defeating ISR everywhere. The header now resolves auth state client-side
(`components/layout/use-header-user.ts`), trading a brief "signed out" flash on first paint for
static/ISR-eligible public pages. If you'd rather have the header always correct on first paint
at the cost of full dynamic rendering site-wide, revert `layout.tsx` to fetch server-side — but
know that's the trade-off.

`getXBySlug` functions in `lib/data/*.ts` are wrapped in React's `cache()`, so a detail page's
`generateMetadata` and the page component itself (which both call the same function) only hit
Supabase once per request instead of twice.

---

## 8. Deploying

### Vercel (recommended)
1. Push to GitHub.
2. Import at [vercel.com/new](https://vercel.com/new) — auto-detects Next.js.
3. Add the `.env.local` variables in Project Settings → Environment Variables.
4. Deploy. `vercel.json` sets sensible caching headers for images and the service worker.

### GitHub
`.github/workflows/ci.yml` runs type-check, lint, and build on every push/PR — it deliberately
builds *without* Supabase env vars set, so it exercises the mock-data fallback path rather than
hitting a real database from CI. Add real secrets under repo Settings → Secrets if you want CI to
build against your actual project instead.

### Pre-launch checklist
- Set `NEXT_PUBLIC_SITE_URL` to your real domain (used by `metadataBase`, `sitemap.ts`, `robots.ts`)
- Replace placeholder icons in `public/icons/` and `app/icon.png`/`apple-icon.png`
- Swap placeholder photography for real listings via the admin panel's image upload
- Run Lighthouse and confirm PWA installability + Core Web Vitals

---

## 9. Known limitations

- No automated tests (unit/integration). Given the auth/payment-adjacent surface area (reviews,
  favorites, admin writes), add coverage for the server actions and RLS policies before a real
  launch.
- Admin forms upload one cover image per listing; `ImageUploader` supports multiple buckets/
  folders but each form only wires up a single image field — extend for full photo galleries.
- The Somaliland flag is a hand-built SVG approximation (green/white/red, black star, Shahada
  text) rather than an official brand asset — swap `public/flags/somaliland.svg` for an official
  file if you have one; every other reference points at this one path.

---

## 10. What was actually verified (and how) vs. what needs a real build

Verified by static analysis in this sandbox (no network access):
- Every `.ts`/`.tsx` file is brace/paren-balanced (scripted check across all ~160 files)
- Every admin route (6 content types × list/new/edit + users + overview) exists and imports its
  form component correctly
- Every public page's `generateMetadata` returns a correct per-locale `alternates.canonical`
- The public/cookie-aware Supabase client split is applied consistently — spot-checked via grep
  that no `lib/data/*.ts` file reading public content still imports the cookie-aware client
- No stale imports of removed exports (e.g. `HeaderUser` after moving it out of `site-header.tsx`)
- No Somalia flag emoji or references anywhere in the codebase

**Not verified** (requires an actual environment): a real `npm install && npm run build`, ESLint
passing cleanly beyond config validity, runtime behavior of the Supabase auth cookie flow, and
Leaflet/map rendering. Run `.github/workflows/ci.yml`'s steps locally first if you want a final
check before deploying.

---

## 11. Tech stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) ·
next-intl · Framer Motion · react-leaflet (OpenStreetMap) · lucide-react · next-themes.
