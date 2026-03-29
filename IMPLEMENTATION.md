# Sunset Design — Implementation Plan

**Date:** 2026-03-28
**Status:** In progress (Phases 0-5 complete)
**Estimated delivery target:** Before June 2026 (condo completion)

---

## Phase 0: Project Scaffold
**Goal:** Dev environment ready, can run locally

- [x] Initialize Vite + React + TypeScript project
- [x] Install dependencies: Tailwind CSS, @supabase/supabase-js, zustand
- [x] Configure Tailwind with Algarve Twilight design tokens (colors, fonts, spacing)
- [x] Add Google Fonts: Noto Serif + Manrope
- [x] Set up Supabase client using `.env.local`
- [x] Create folder structure:
  ```
  src/
    components/    # Shared UI components
    pages/         # Route-level pages
    layouts/       # Desktop + Mobile layout shells
    hooks/         # Custom React hooks
    lib/           # Supabase client, utilities
    stores/        # Zustand stores
    types/         # TypeScript types
  ```
- [x] Set up React Router (Home, Rooms, Search, Budget, Room Detail, Pin Detail)
- [x] Verify dev server runs: `npm run dev`
- [x] Init git repo, push to GitHub (taramccann83/sunset-design)
- [x] Connect to Netlify for auto-deploy

---

## Phase 1: Database + Core Data Layer
**Goal:** Tables exist, can read/write pins and boards

- [x] Write `schema.sql` with all tables (boards, pins, pin_tags)
- [x] Apply schema to live Supabase DB via `pg` module
- [x] Seed the 8 pre-defined room boards with areas and orientations
- [x] Create Supabase Storage bucket: `pin-images`
- [x] Create Supabase Storage bucket: `page-snapshots` (for VPN cache)
- [x] Build Supabase client helper (`src/lib/supabase.ts`)
- [x] Build data hooks:
  - `useBoards()` — fetch all boards
  - `useBoard(slug)` — fetch single board with pins
  - `usePins(filters)` — fetch pins with tag/status/search filters
  - `usePin(id)` — fetch single pin with all details
  - `useCreatePin()` — insert pin + upload image
  - `useUpdatePin()` — update pin metadata/status
  - `useBudget()` — aggregate spending per board

---

## Phase 2: Design System + Shared Components
**Goal:** All reusable UI components built, matching DESIGN.md

- [x] **Tailwind config:** Full Algarve Twilight token system
  - Colors, spacing scale, font families, border radius, shadows
- [x] **Layout shells:**
  - Desktop: Solid Deep Atlantic Navy vertical rail nav, flush left
  - Mobile: Solid Deep Atlantic Navy bottom tab bar
  - Responsive breakpoint switching
- [x] **Components:**
  - `Button` — Primary (gradient), Secondary (ghost), Tertiary (text), Inverted
  - `PinCard` — 4:3 thumbnail, status badge, name, store, price
  - `BoardCard` — Room hero image, name overlay, pin count, budget label
  - `StatusBadge` — Styled per status (ghost, gradient, sage, etc.)
  - `Tag` — Small pill, removable variant
  - `SearchInput` — Minimalist, bottom-border focus style
  - `BudgetBar` — Progress bar with spent vs. budget
  - `FAB` — Floating action button (gradient, ambient shadow)
  - `Modal` — Pin detail overlay (slide-up mobile, fade-scale desktop)
  - `GlassCard` — Glassmorphic container for nav/overlays
  - `VpnBadge` — "VPN Required" indicator on pins
  - `PinDetailView` — Full detail view with read mode + edit mode + delete with confirmation
  - `TagEditor` — Autocomplete dropdown + browse-all-tags panel (? icon)

---

## Phase 3: Pages + Navigation
**Goal:** All pages wired up, can browse rooms and pins

- [x] **Home page:**
  - Recent pins (horizontal scroll or grid)
  - Featured rooms (top 2-3 boards)
  - Quick stats (total pins, total spent, boards count)
- [x] **Rooms page:**
  - Grid of BoardCards (Living & Dining as hero, Terrace as secondary hero)
  - Sorted by pre-seeded order
- [x] **Room Detail page:**
  - Room hero headline + area/orientation subtitle
  - Budget progress bar at top
  - Pins grouped by tag in horizontal scrollable sections
  - "Add Item" gradient CTA
- [x] **Pin Detail view:**
  - Full uncropped image
  - All metadata fields (editable inline)
  - Status quick-change buttons
  - "Visit Store" link (with VPN reminder if flagged)
  - "View Cached Page" if snapshot exists
  - Tags, notes, dimensions
- [x] **Search page:**
  - Search input with filters (board, tag, status, price range, store)
  - Results in masonry grid of PinCards
- [x] **Budget page:**
  - Per-room budget bars
  - Total overview
  - Breakdown by status (wishlist total vs. committed total)
- [x] Pin detail modal integrated into Home, Rooms Detail, and Search pages
- [x] Inline status change (stays in modal, updates locally)
- [x] Room cards show collage grid of pin images (1 large + 2 small)

---

## Phase 3.5: Mood Board
**Goal:** Pure visual inspiration page, separate from product pins

- [x] Create `inspo_images` table (id, image_url, source_url, caption, created_at, updated_at) with RLS policy
- [x] Create Supabase Storage bucket: `inspo-images` (public)
- [x] Create Supabase Edge Function: `scrape-images` (fetches webpage URL, extracts image URLs)
- [x] Add `InspoImage` type to `src/types/index.ts`
- [x] Build data hooks:
  - `useInspoImages()` — fetches all inspo images ordered by created_at desc
  - `useInspoMutations()` — create, update, delete, upload inspo images
- [x] **Components:**
  - `InspoCard` — masonry card with natural aspect ratio, caption overlay, hover delete X
  - `InspoAddCard` — dashed "+" placeholder card
  - `InspoUploadDialog` — two modes: "Browse URL" (scrape + pick) and "Upload File" (drag-and-drop)
  - `InspoLightbox` — fullscreen viewer with arrow key nav, caption, source link, delete
  - `MoodBoardCard` — special card on Rooms page showing collage of inspo images
- [x] **Page:** `MoodBoard.tsx` — masonry grid (CSS columns, no library), add card, upload dialog, lightbox
- [x] Add `/mood-board` route in App.tsx
- [x] Add MoodBoardCard as last item in Rooms.tsx grid

---

## Phase 3.6: Budget Page Redesign + Currency Toggle
**Goal:** Rich budget visualizations and multi-currency support across the app

### Database Changes
- [x] New table: `app_settings` (key text primary key, value jsonb not null) with RLS "Allow all"
- [x] New columns on `pins`: `price_currency` (text, default 'EUR', check EUR/USD), `exchange_rate` (numeric)

### Budget Page Redesign
- [x] Add Recharts dependency
- [x] `BudgetDonut` component — donut chart showing committed spend per room with warm color palette
- [x] `BudgetStackedBar` component — stacked bars per room (installed/ordered/wishlist segments with budget marker)
- [x] Improved summary cards with colored left accent bars
- [x] `BudgetConfigure` component — collapsible section to set master budget + per-room budgets
- [x] Master budget stored in `app_settings` table (key: `master_budget`)
- [x] Room budgets use existing `boards.budget_eur` column
- [x] Over-budget / unallocated warnings when room allocations vs master budget don't match
- [x] Full redesign of `Budget.tsx` page integrating all new components

### Currency Toggle (EUR/USD)
- [x] `CurrencyContext` (`src/contexts/CurrencyContext.tsx`) wrapping the entire app
- [x] Live exchange rate fetched from frankfurter.dev API (ECB rates, no API key) on app load
- [x] Fallback to 1.08 if API unavailable, with visual warnings (golden dot on nav toggle, banner on Budget page)
- [x] Currency preference persisted in `app_settings` table (key: `currency_preference`)
- [x] Toggle button in nav bar (desktop rail bottom, mobile tab bar end) showing active currency highlighted
- [x] `useAppSettings` hook (`src/hooks/useAppSettings.ts`) for reading/writing app_settings

### Pin Currency Support
- [x] `price_currency` field on pins (EUR or USD) — user picks which currency they paid in
- [x] `exchange_rate` field on pins — snapshots the live rate when pin moves to "ordered" status
- [x] Currency dropdown in PinDetailView edit mode next to price field
- [x] Exchange rate input with "Use live rate" button when USD is selected
- [x] Conversion logic: EUR pins display as-is or convert via rate; USD pins with locked rate use that rate; USD wishlist pins use live rate

### Format Utilities
- [x] `formatCurrency`, `pinPriceInEur`, `currencySymbol` functions in `src/lib/format.ts`
- [x] All price displays across the app use CurrencyContext instead of formatEuro

### Modified Files
- `src/App.tsx` — wrapped in CurrencyProvider
- `src/layouts/AppLayout.tsx` — added CurrencyToggle component
- `src/lib/format.ts` — added currency format functions
- `src/types/index.ts` — added Currency type, price_currency and exchange_rate to Pin
- `src/hooks/useBudget.ts` — added refetch + updateBoardBudget
- `src/hooks/usePinMutations.ts` — UpdatePinInput includes price_currency, exchange_rate
- `src/pages/Budget.tsx` — full redesign
- `src/components/PinDetailView.tsx` — currency picker + exchange rate field
- `src/components/PinCard.tsx` — uses CurrencyContext
- `src/components/BoardCard.tsx` — uses CurrencyContext
- `src/components/BudgetBar.tsx` — uses CurrencyContext

---

## Phase 4: Chrome Extension
**Goal:** Can pin images from any website

- [x] Create extension directory: `extension/`
- [x] `manifest.json` (Manifest V3, ES module service worker)
- [x] **Content script** (`content.js`):
  - Detect all meaningful images on page (filters out icons/spacers < 120px)
  - Also detects CSS background images on common product containers
  - Auto-scrape price, store name, product name from page metadata:
    - JSON-LD structured data (recursive Product search, handles @graph)
    - Open Graph / meta tags (og:title, product:price:amount, og:site_name)
    - Common price CSS selectors as fallback (.price, [itemprop="price"], etc.)
    - Domain name fallback for store name
  - `.pt` TLD auto-detection for VPN flag (manual toggle always available)
  - `__sunsetDesignScrapeDetails()` function for caching product description/specs on VPN-flagged pins
- [x] **Popup panel** (`popup.html`, `popup.js`):
  - Shows all images on current page in a 3-column grid
  - Multi-select with visual checkmarks
  - Two-step flow: select images -> fill metadata form
  - Metadata form: board, status, tags, price + currency, store, product name, notes
  - "Requires VPN" toggle with notice about screenshot capture
  - Single-pin mode shows all fields; multi-select hides per-pin fields (price, name, notes)
  - Saving state, success state, error state with auto-close on success
- [x] **Right-click flow** (`confirm.html`, `confirm.js`):
  - Context menu: "Pin to Sunset Design" on any image
  - Opens a popup window with image preview + full metadata form
  - Pre-fills form from scraped page metadata
  - Same save/success/error states as popup
- [x] **Background service worker** (`background.js`):
  - Context menu registration on install
  - Image upload to Supabase Storage (`pin-images` bucket) via fetch
  - Pin record insert to Supabase REST API
  - Tag insertion for pins
  - Batch save for multi-select (processes sequentially, reports per-image success/failure)
  - Full-page screenshot capture: scroll-and-capture each viewport, stitch via offscreen document canvas
  - Page snapshot upload to `page-snapshots` bucket for VPN-flagged pins
- [x] **Offscreen document** (`offscreen.html`, `offscreen.js`):
  - Canvas-based stitching of viewport captures into single tall image (MV3 requirement)
  - Handles last-capture offset for non-divisible page heights
- [x] **Supabase client** (`lib/supabase.js`):
  - Lightweight fetch-based client (no SDK, better for extension context)
  - Functions: fetchBoards, fetchTags, uploadImage, insertPin, insertTags, uploadImageFromUrl, uploadSnapshot
- [x] **Extension UI:** Styled with Algarve Twilight tokens
  - Sunset gradient CTAs, sandy surface background, ghost borders
  - Noto Serif headlines + Manrope UI text
  - Custom select dropdowns, checkbox styling, scrollbar styling
  - Spinner, success, and error states
- [x] **Icons:** Sunset logo resized to 16, 48, 128px

### Extension Files
```
extension/
  manifest.json          # Manifest V3 config
  background.js          # Service worker (context menu, saves, screenshots)
  content.js             # Page scraping (images, metadata, VPN detection)
  popup.html/js          # Toolbar popup (image grid + metadata form)
  confirm.html/js        # Right-click confirmation window
  offscreen.html/js      # Canvas stitching for full-page screenshots
  styles.css             # Algarve Twilight design tokens
  lib/config.js          # Supabase credentials, VPN TLDs
  lib/supabase.js        # Fetch-based Supabase client
  icons/                 # 16, 48, 128px sunset icons
```

---

## Phase 5: Mobile PWA
**Goal:** Can save pins from mobile via share sheet

- [x] Generate PWA icons: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/apple-touch-icon.png`
- [x] Create web app manifest: `public/manifest.webmanifest` (name, icons, theme color #001F3F, display standalone, share target)
- [x] Create service worker: `public/sw.js` (share target POST handler, precaching, network-first API caching)
- [x] Update `index.html` with manifest link, apple-touch-icon, theme-color meta, SW registration
- [x] Create Netlify config: `public/_redirects` (SPA fallback) + `netlify.toml` (SW headers)
- [x] Write Supabase Edge Function: `scrape-page` — server-side metadata extraction (JSON-LD, OG tags, prices, images)
- [x] Deploy `scrape-page` to Supabase (project ref: ijusthxxbsjwetoijhrm)
- [x] Create `useShareTarget` hook — reads shared data from SW cache
- [x] Create `useScrapePage` hook — calls scrape-page Edge Function
- [x] Build `ShareTarget.tsx` page — mobile-first mini form with three entry modes:
  - URL share: auto-scrape metadata, OG image + "See more images" grid
  - Image share: direct file preview + empty form
  - Manual fallback: URL paste + image upload
- [x] Add `/share` route outside `<AppLayout>` (standalone, no nav bars)
- [x] Vite build passes (pre-existing TS errors in unrelated files; vite build succeeds)
- [ ] Test PWA install on iOS Safari and Android Chrome
- [ ] Test share target from mobile browser and Photos app

**File structure:**
```
public/
  manifest.webmanifest     # PWA manifest with share_target
  sw.js                    # Service worker (share target + caching)
  pwa-192x192.png          # PWA install icon
  pwa-512x512.png          # PWA install icon
  apple-touch-icon.png     # iOS home screen icon
  _redirects               # Netlify SPA fallback
netlify.toml               # Netlify headers (SW no-cache)
src/
  pages/ShareTarget.tsx    # Share target mini form page
  hooks/useShareTarget.ts  # Read shared data from SW cache
  hooks/useScrapePage.ts   # Call scrape-page Edge Function
supabase/
  functions/scrape-page/index.ts  # Metadata scraping Edge Function
```

---

## Phase 6: Polish + Launch
**Goal:** Production-ready, delightful to use

- [ ] Motion/transitions: fade-ins, card entrances, page transitions (per DESIGN.md)
- [ ] Empty states: beautiful illustrations for boards with no pins yet
- [ ] Loading states: skeleton cards matching Algarve Twilight palette
- [ ] Error handling: warm-toned toast notifications
- [ ] Responsive QA: test desktop, tablet, mobile
- [ ] Performance: lazy load images, virtualize long pin lists
- [ ] PWA icons and splash screen
- [ ] Final Netlify deploy from `main`
- [ ] Set up custom domain (TBD)
- [ ] Update `~/TOOLS.md` with Sunset Design entry

---

## Build Order Summary

| Phase | What | Depends On | Effort |
|-------|------|-----------|--------|
| 0 | Scaffold | Nothing | Small |
| 1 | Database + Data Layer | Phase 0 | Medium |
| 2 | Design System + Components | Phase 0 | Medium |
| 3 | Pages + Navigation | Phase 1 + 2 | Large |
| 3.5 | Mood Board | Phase 3 | Medium |
| 3.6 | Budget Redesign + Currency | Phase 3 | Medium |
| 4 | Chrome Extension | Phase 1 | Large |
| 5 | Mobile PWA | Phase 3 | Medium |
| 6 | Polish + Launch | Phase 3 + 4 | Medium |

**Phases 1 and 2 can be built in parallel.**
**Phase 4 (extension) can start as soon as Phase 1 is done.**

---

*Check off items as completed. This is the source of truth for build progress.*
