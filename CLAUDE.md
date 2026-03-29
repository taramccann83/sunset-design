# CLAUDE.md — Sunset Design

## Project Overview

Sunset Design is a personal Pinterest-like app for curating design inspiration and tracking purchases for Tara's sunset condo in Ericeira, Portugal. It has two parts: a Chrome browser extension for capturing product images while shopping, and a web app gallery for organizing, browsing, and budgeting.

## Key Documents

- `PRD.md` — Product requirements, features, room boards, database schema, data flow
- `DESIGN.md` — Full design system (Algarve Twilight), components, layout, motion, spacing

Read both before making any design or architecture decisions.

## Tech Stack

- **Web App:** Vite + React + Tailwind CSS
- **Charts:** Recharts (donut chart, stacked bars on Budget page)
- **State:** React Context or Zustand
- **Backend:** Supabase (Postgres + Storage + Realtime)
- **Image Storage:** Supabase Storage (buckets: `pin-images`, `inspo-images`)
- **Hosting:** Netlify (auto-deploy from GitHub `main`)
- **Chrome Extension:** Manifest V3 (vanilla JS + HTML)
- **PWA:** Service Worker + Web App Manifest + Share Target API

## Design System: Algarve Twilight

### Colors (use these exact tokens)
- Primary: `#FF7E5F` (sunset coral)
- Primary Dark: `#a13920` (deep terracotta — gradient start)
- Primary Container: `#fe7d5e` (warm coral — gradient end)
- Secondary: `#001F3F` (deep Atlantic navy)
- Tertiary: `#D4AF37` (golden ochre — sparingly)
- Surface: `#f8f6f2` (sandy background)
- Surface Container Lowest: `#ffffff` (cards)
- Neutral: `#FDFBF7` (warm off-white)
- On-Surface: `#2e2f2d` (text — never use pure #000)
- On-Surface Variant: `#5b5c59` (secondary text)

### Typography
- Headlines: **Noto Serif** (editorial, display)
- UI/Body: **Manrope** (clean, functional)

### Signature Patterns
- **CTA gradient:** `linear-gradient(135deg, #a13920, #fe7d5e)`
- **Glassmorphism:** surface at 70% opacity + 20px backdrop blur
- **No hard borders** — use surface tonal shifts for boundaries
- **Ghost borders only** when accessibility requires edges: `#aeadaa` at 15% opacity
- **Ambient shadows** on floating elements: 40-60px blur, 4-6% opacity, tinted (not pure black)
- **No standard Material UI shadows** — ever

### Status Colors (warm-shifted)
- Success/Installed: muted sage green
- Warning: golden ochre (`#D4AF37`)
- Error: deep terracotta (`#a13920`)

## Room Boards (Pre-seeded)

1. Living & Dining (45.81 m², west-facing — sunset views, hero room)
2. Kitchen (7.37 m²)
3. Primary Bedroom (17.06 m² with closet)
4. Guest Bedroom (14.90 m²)
5. Bathrooms (3 combined, 10.79 m²)
6. Terrace (60.83 m², east-facing — morning sun)
7. Entry & Hallway (8.05 m²)
8. General Inspo (cross-room)

## Development Rules

### Deployment
- **Always `git push`** — never `netlify deploy --prod`
- Netlify auto-deploys from `main` branch
- CLI builds produce different chunk hashes than Netlify's git-triggered builds, causing CDN asset mismatches

### Supabase
- `schema.sql` is a reference file, NOT auto-migrated — must manually apply changes to live DB
- Supabase REST API silently ignores writes to nonexistent columns — always verify columns exist

### Code Style
- No emojis in code or code comments
- Components in PascalCase, files match component name
- Tailwind for all styling — no inline styles, no CSS modules
- Prefer composition over prop drilling

### Design Implementation
- Reference `DESIGN.md` for every UI decision
- 4:3 aspect ratio for grid thumbnails, full uncropped in detail view
- Mobile is a **distinct experience**, not a shrunken desktop
- Desktop: solid Deep Atlantic Navy (#001F3F) full-height vertical rail nav, flush left edge, no rounded corners, no margin. White icons (white/90 inactive, white active with gradient pill).
- Mobile: solid Deep Atlantic Navy bottom tab bar, same icon treatment.
- Motion: subtle and smooth only — no bounce, parallax, or 3D transforms
- Generous spacing — when in doubt, add more space

### VPN / Geo-Restricted Sites
- Many Portuguese shops require VPN — the extension auto-detects and flags pins with "VPN Required"
- Flagged pins get a page snapshot (screenshot + product details) cached in Supabase Storage
- Manual "Requires VPN" toggle on pin form (defaults ON when auto-detected)
- "Visit Store" shows a VPN reminder on flagged pins
- Three DB columns: `requires_vpn` (bool), `page_snapshot_url` (text), `cached_product_details` (jsonb)

### Supabase Edge Functions
- `scrape-images` — fetches any webpage URL and extracts image URLs (used by Mood Board's "Browse URL" flow)

### Image Handling
- Pin images stored in Supabase Storage bucket `pin-images`
- Inspo images stored in Supabase Storage bucket `inspo-images` (public)
- Thumbnails: 4:3 crop, `object-fit: cover`
- Detail view: full uncropped image at natural aspect ratio
- No filters or overlays on images

## Navigation Structure

- **Home** — Full-bleed hero image (`public/hero.png`) with "Sunset Condo Design" title in white with layered text shadows (no overlay, no tagline). Recent pins, featured rooms.
- **Rooms** — Room cards grid (enter a room to see its board)
- **Search** — Full-text search, filter by tag/store/status/price
- **Budget** — Redesigned spending dashboard: donut chart (committed spend per room), stacked bars per room (installed/ordered/wishlist segments with budget marker), summary cards with colored accent bars, collapsible "Configure Budgets" section for master budget + per-room budgets. Shows over-budget or unallocated warnings when room allocations vs master budget don't match.
- **Mood Board** (`/mood-board`) — Pinterest-style masonry grid of pure visual inspiration images. No prices, stores, or status tracking. Accessed from the Rooms page as a special card at the end of the grid. Uses `inspo_images` table and `inspo-images` storage bucket. Browse URL flow uses the `scrape-images` Edge Function.
- **Currency Toggle** — EUR/USD toggle in nav bar (desktop rail bottom, mobile tab bar end). Active currency highlighted. Golden dot warning indicator when using fallback exchange rate.

### Currency System

- Global `CurrencyContext` wraps the entire app (`src/contexts/CurrencyContext.tsx`)
- Live exchange rate fetched from frankfurter.dev API (ECB rates, no API key) on app load
- Falls back to 1.08 if API unavailable, with visual warnings (golden dot on nav toggle, banner on Budget page)
- Currency preference persisted in `app_settings` table (key: `currency_preference`)
- All price displays use the context: PinCard, BoardCard, PinDetailView, BudgetBar, BudgetStackedBar, BudgetDonut, BudgetConfigure, Budget page
- Pins have a `price_currency` field (EUR or USD) and an optional `exchange_rate` field (snapshots the live rate when pin moves to "ordered" status)
- Conversion logic: EUR pins display as-is or convert via live rate; USD pins with a locked exchange rate use that rate; USD wishlist pins use the live rate

### Chrome Extension

The extension lives in `extension/` and is loaded unpacked in Chrome (not bundled with the web app).

**Architecture:** Extension pages (popup, confirm) call Supabase REST API directly via `fetch` — no message passing through the service worker. The service worker only handles the right-click context menu and opening the confirm window. This avoids MV3 service worker sleep issues.

**No ES module imports in extension pages.** Popup and confirm scripts are self-contained with inline Supabase credentials and API calls. Module imports fail silently in extension page contexts.

**Storage RLS:** The `pin-images` and `page-snapshots` buckets require public SELECT, INSERT, UPDATE, and DELETE policies on `storage.objects`.

**Tag UI:** Both popup and confirm forms show existing tags as clickable pills (fetched from `pin_tags` table). New tags can be typed and added with Enter.

**VPN detection:** Auto-flags `.pt` domain sites. Manual toggle always available.

**Icons:**
- Extension icon (navy + white sunset): `extension/icons/icon{16,48,128}.png` — sourced from `~/Desktop/Icon 2.png`
- Toolbar icon (white sunset on transparent): `extension/icons/toolbar{16,32,48}.png`
- Web app favicon: `public/favicon.png` — sourced from `~/Desktop/Icon 2.png`

### PWA & Share Target

The app is a Progressive Web App. Users can install it on mobile and share URLs or images directly to it.

**Manifest:** `public/manifest.webmanifest` — name, icons, theme color, share target config.

**Service Worker:** `public/sw.js` — handles share target POST interception, precaches app shell, network-first for API calls. Registered in `index.html` inline script.

**iOS limitation:** iOS does not support the Share Target API (not even for URLs). The primary mobile pin flow on iPhone is via the **+ button** in the nav bar, which opens `/share` for manual URL paste or camera roll upload.

**Share Target flow (Android only):**
1. OS shares URL/image to Sunset Design via `POST /share` (multipart/form-data)
2. Service worker intercepts, reads FormData, stores in Cache API (`share-target-cache`)
3. Redirects to `/share?source=share-target`
4. `ShareTarget.tsx` reads cached data via `useShareTarget` hook, calls `scrape-page` Edge Function for URLs
5. User fills mini form (room, tags, price, etc.) and saves pin

**`/share` route** is outside `<AppLayout>` — standalone page with no nav rail/bottom bar. Still wrapped in `CurrencyProvider`.

**+ button in nav:** Desktop rail nav has a "+" button linking to `/share` above the currency toggle. On mobile, the "+" is a floating action button (FAB) — coral gradient circle positioned bottom-right, above the nav bar.

**Three entry modes:**
- URL share (from browser) — auto-scrapes metadata, shows OG image + "See more images"
- Image share (from Photos/Instagram) — shows image preview, empty form
- Direct navigation / + button (primary iOS flow) — manual URL paste + camera roll upload

**Scrape-blocked sites:** Many sites (Zara Home, etc.) block server-side scraping. When the Edge Function gets no images, the page shows a prominent "Upload from Camera Roll" button and filters out junk product names (e.g. "Service Unavailable"). The `useScrapePage` hook calls the Edge Function via direct `fetch` (not `supabase.functions.invoke`, which fails with `net::ERR_FAILED` on Vite 8 / Supabase SDK v2).

**Icons:** `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png` — all from `~/Desktop/Icon 2.png`

### Image Editor

The ShareTarget page includes a crop/rotate/zoom editor (`ImageEditor.tsx`, powered by `react-easy-crop`). After selecting or uploading an image, an "Edit" button appears on the preview. The editor opens full-screen with:
- Pinch-to-zoom and drag crop area
- Aspect ratio presets: Free, 4:3, 1:1, 16:9
- 90-degree rotation
- Zoom slider

When done, the cropped image replaces the original as a JPEG blob. Works on both desktop (mouse) and mobile (touch gestures).

### Toast Notifications

`ToastProvider` wraps the app in `App.tsx`. Use `useToast()` to show notifications:
- `toast('message', 'success')` — sage green
- `toast('message', 'error')` — deep terracotta
- `toast('message', 'info')` — deep navy (default)

Toasts auto-dismiss after 3 seconds with slide-up/slide-down animations. Positioned above mobile nav bar, bottom-center on desktop.

### Animations & Loading States

- **Card entrances:** `animate-fade-in-up` with staggered `animationDelay` per card index
- **Skeleton loading:** `SkeletonCard` component with pulse animation, used on all pages during data fetch
- **Empty states:** `EmptyState` component with SVG illustrations for pins, search, and budget empty views
- **Route code splitting:** All pages lazy-loaded via `React.lazy()` + `Suspense`
- **Lazy images:** `loading="lazy"` on PinCard, BoardCard, InspoCard images

### Supabase Edge Functions

- `scrape-images` — fetches any webpage URL and extracts image URLs (used by Mood Board's "Browse URL" flow)
- `scrape-page` — fetches URL, extracts images + metadata (JSON-LD, OG tags, price, store, product name). Used by Share Target and any future URL-based pin creation. JWT disabled (called from PWA with anon key).

### Layout Note

The AppLayout provides no padding or max-width — each page manages its own `max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8` wrapper. The Home page hero sits outside this wrapper for full-bleed.
