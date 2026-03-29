# Sunset Design — Product Requirements Document

**Version:** 1.0
**Date:** 2026-03-28
**Author:** Tara McCann
**Status:** Draft

---

## 1. Overview

**Sunset Design** is a personal Pinterest-like app for curating design inspiration and tracking purchases for Tara's sunset condo in Ericeira, Portugal — a T2 (2-bedroom) ground floor unit in the SUNSET development (Bloco E), Fraction AH. The condo features 119.66 m² of interior space plus a 60.83 m² east-facing terrace, with the main living room's large windows facing west for sunset views. It combines a Chrome browser extension for capturing product images from online shops with a beautiful web gallery for organizing, browsing, and budgeting.

### Problem

When shopping online for furniture, decor, tiles, fixtures, and architectural inspiration across dozens of websites, there's no easy way to:
- Save images with their source links in one place
- Organize finds by room and category
- Track prices and budgets per room
- Move items through a status pipeline (wishlist -> ordered -> arrived -> installed)

### Solution

A two-part tool:
1. **Chrome Extension** — Right-click or popup panel to capture any image + its source URL while browsing
2. **Web App (PWA)** — A masonry-grid gallery with boards, tags, budget tracking, and status management

---

## 2. Target User

- **Solo user:** Tara McCann (private tool, no auth required)
- **Devices:** MacBook (primary browsing/pinning), iPhone/iPad (mobile saves via PWA share sheet, gallery browsing)
- **Access:** Public URL on Netlify, no authentication — obscure URL is sufficient

---

## 3. Core Features

### 3.1 Chrome Extension — Image Capture

#### Right-Click Capture
- Right-click any image on any website
- Context menu option: "Pin to Sunset Design"
- Saves: image, page URL, page title
- Auto-detects price and store name from page metadata/structured data
- Opens a small confirmation popup to:
  - Select a board (room)
  - Add/edit tags
  - Edit auto-detected price and store name
  - Add notes
  - Set status (defaults to "Wishlist")
  - Add dimensions (optional)

#### Popup Panel Capture
- Click the Sunset Design icon in Chrome toolbar
- Panel displays all images found on the current page in a grid
- Select one or multiple images to save
- Same metadata form as right-click (board, tags, price, notes, etc.)
- Bulk-assign board and tags when saving multiple images

### 3.2 VPN / Geo-Restricted Site Handling

Many Portuguese and EU furniture/decor shops are geo-restricted — accessible only via VPN. Sunset Design handles this with a three-layer approach:

#### Auto-Detection + Badge
- The extension checks if the user is likely on a VPN (by comparing the site's geo-availability or detecting common VPN indicators)
- Pins from VPN sessions are automatically flagged with a "VPN Required" badge
- When clicking "Visit Store" on a flagged pin, a reminder appears: "This site may require VPN to access"

#### Page Snapshot Cache
- When pinning from a VPN session, the extension captures a **full page snapshot** (screenshot + key product details: name, price, description, specs)
- Snapshot stored in Supabase Storage alongside the pin image
- If the source URL becomes inaccessible later, the cached snapshot preserves all product info
- Accessible from pin detail view via "View Cached Page" button

#### Manual VPN Tag
- The pin form includes a "Requires VPN" toggle
- Defaults to ON when VPN is auto-detected, but can be manually toggled for any pin
- Searchable/filterable — find all pins that need VPN to revisit

#### Database Additions
- `pins.requires_vpn` — boolean, default false
- `pins.page_snapshot_url` — text, nullable (Supabase Storage URL for cached page screenshot)
- `pins.cached_product_details` — jsonb, nullable (scraped product name, description, specs)

### 3.3 Mobile PWA — Share Sheet Capture

- Sunset Design web app registered as a PWA share target
- On mobile: browse a shop -> tap Share -> "Sunset Design"
- App opens with the shared URL, scrapes images from the page
- User picks which image(s) to save and fills in metadata
- Works on iOS Safari and Android Chrome

### 3.3 Web App — Gallery & Organization

#### Masonry Grid Layout
- Pinterest-style responsive masonry grid
- Infinite scroll or paginated loading
- Click any pin to open detail view (full image, all metadata, source link)

#### Boards (by Room)
- Pre-seeded boards based on condo floor plan (rooms TBD — Tara to provide floor plan)
- Custom board creation for additional categories
- Board cover image (auto-set from first pin or manually chosen)
- Board-level budget with progress bar

#### Tags
- Free-form tags on any pin (e.g., "tiles", "lighting", "terracotta", "azulejo")
- Tag cloud or filter sidebar
- Cross-board tag filtering (e.g., show all "lighting" across every room)

#### Search
- Full-text search across pin notes, store names, tags, and board names
- Filter by: board, tag, status, price range, store

#### Pin Status Pipeline
- **Wishlist** — saved for consideration
- **Shortlisted** — actively considering / comparing
- **Ordered** — purchased, awaiting delivery
- **Arrived** — delivered, awaiting installation
- **Installed** — done!
- **Rejected** — decided against (hidden from default view, still searchable)

#### Pin Detail View
- Full-size image
- Source URL (clickable link back to the shop)
- Store name
- Price (with currency)
- Dimensions (W x H x D)
- Notes (free text)
- Board assignment
- Tags
- Status (with quick-change buttons)
- Date pinned
- Edit all fields inline

### 3.4 Budget Tracking

- Set a budget per board (room)
- Running total of pinned items by status:
  - Wishlist total (what you'd spend if you bought everything)
  - Ordered/Arrived/Installed total (what you've actually committed)
- Visual progress bar: spent vs. budget per room
- Dashboard view showing all rooms' budgets at a glance
- Currency: EUR (primary, since Portugal)

### 3.5 Auto-Detection (Smart Scraping)

The extension attempts to automatically extract from the current page:
- **Price** — from structured data (JSON-LD, Open Graph, meta tags), or common price CSS selectors
- **Store name** — from domain name, Open Graph site_name, or page title
- **Product name** — from page title or h1
- All auto-detected fields are editable before saving

---

## 4. Visual Design

### Aesthetic: Algarve Twilight

See `DESIGN.md` for the full design system. Key points:

- **Design System:** "Algarve Twilight" — The Atlantic Veranda creative north star
- **Color palette:** Sunset coral (#FF7E5F), deep Atlantic navy (#001F3F), golden ochre (#D4AF37), warm sand surfaces (#FDFBF7)
- **Typography:** Noto Serif (editorial headlines) + Manrope (functional UI)
- **Signature elements:** Primary gradient CTAs (#a13920 to #fe7d5e at 135deg), glassmorphism nav, tonal surface layering, no hard borders
- **Motion:** Subtle and smooth — gentle fades, soft scale-ups, no bounce/parallax

---

## 5. Room Boards (Pre-seeded)

Based on the T2 Dto floor plan (ground floor right, Bloco E):

| # | Board | Rooms Covered | Area | Orientation | Notes |
|---|-------|--------------|------|-------------|-------|
| 1 | **Living & Dining** | Sala | 45.81 m² (493 ft²) | West-facing (sunset views) | The hero room. Large windows. Floating floors. |
| 2 | **Kitchen** | Cozinha | 7.37 m² (79 ft²) | Interior | BOSCH appliances, Silestone/granite counters, lacquered cabinets |
| 3 | **Primary Bedroom** | Quarto 1 + Closet | 13.69 + 3.37 m² (183 ft²) | Interior/North | Includes built-in closet |
| 4 | **Guest Bedroom** | Quarto 2 | 14.90 m² (160 ft²) | Interior/North | Adjacent to terrace access |
| 5 | **Bathrooms** | All 3 I.S. | 2.55 + 4.60 + 3.64 m² (116 ft²) | Various | Ceramic flooring per spec |
| 6 | **Terrace** | Terraço | 60.83 m² (655 ft²) | East-facing (morning sun) | Massive outdoor space wrapping bedrooms |
| 7 | **Entry & Hallway** | Vestibulo + Circulation | 4.98 + 3.07 m² (87 ft²) | Interior | DIERRE security door, elevator access |
| 8 | **General Inspo** | Cross-room | N/A | N/A | Mood boards, architecture, Portuguese details |

### Key Finishes (from builder spec)
- Floating floors in living areas and bedrooms
- Ceramic flooring in kitchen and bathrooms
- Air conditioning in all rooms
- PVC/thermal aluminum window frames with electric shutters
- Solar-heated hot water system
- Acoustic + thermal insulation

---

## 6. Technical Architecture

(Note: section numbers shifted after adding Room Boards section)

### Stack

| Component | Technology |
|-----------|-----------|
| Web App | Vite + React + Tailwind CSS |
| State Management | React Context or Zustand |
| Backend / DB | Supabase (Postgres + Storage + Realtime) |
| Image Storage | Supabase Storage (bucket: `pin-images`) |
| Hosting | Netlify (auto-deploy from GitHub `main`) |
| Chrome Extension | Manifest V3 (vanilla JS + HTML) |
| PWA | Service Worker + Web App Manifest + Share Target API |

### Database Schema (Supabase / Postgres)

#### `boards`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | e.g., "Living Room" |
| slug | text | URL-friendly name |
| cover_image_url | text | nullable |
| budget_eur | numeric | nullable |
| area_sqm | numeric | nullable, room area for reference |
| orientation | text | nullable, e.g. "west", "east" |
| sort_order | integer | display order |
| created_at | timestamptz | |

#### `pins`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| board_id | uuid | FK -> boards.id |
| image_url | text | Supabase Storage URL |
| source_url | text | original shop page URL |
| store_name | text | nullable |
| product_name | text | nullable |
| price_eur | numeric | nullable |
| dimensions | jsonb | { w, h, d, unit } nullable |
| notes | text | nullable |
| status | text | enum: wishlist, shortlisted, ordered, arrived, installed, rejected |
| requires_vpn | boolean | default false, auto-detected or manual |
| page_snapshot_url | text | nullable, Supabase Storage URL for cached page screenshot |
| cached_product_details | jsonb | nullable, { description, specs, full_price_text } |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `pin_tags`
| Column | Type | Notes |
|--------|------|-------|
| pin_id | uuid | FK -> pins.id |
| tag | text | lowercase, trimmed |
| PK | (pin_id, tag) | composite |

### Project Location

```
~/Tara's Apps/sunset-design/
```

### Repository

- GitHub: `taramccann83/sunset-design`
- Netlify: auto-deploy from `main` branch
- Deploy method: `git push` only (never `netlify deploy --prod`)

---

## 6. Data Flow

### Pinning (Desktop)
```
Browser Page
  -> Chrome Extension (right-click or popup panel)
  -> Auto-scrape price/store/product name
  -> User confirms/edits metadata + selects board
  -> Extension uploads image to Supabase Storage
  -> Extension inserts pin record into Supabase Postgres
  -> Web app reflects new pin in real-time (Supabase Realtime)
```

### Pinning (Mobile)
```
Mobile Browser
  -> Share sheet -> Sunset Design PWA
  -> PWA receives shared URL
  -> Scrapes page for images (via Supabase Edge Function proxy)
  -> User picks image + fills metadata
  -> Same upload/insert flow as desktop
```

---

## 7. MVP Scope (v1)

### In Scope
- Chrome extension with right-click + popup panel capture
- Web app with masonry grid, boards, tags, search
- Pin detail view with all metadata fields
- Auto-detect price and store name (best effort)
- Budget per room with progress bar
- Status pipeline (wishlist through installed)
- Coastal Portuguese visual design
- Supabase backend (Storage + Postgres)
- Netlify hosting

### Out of Scope (Future)
- Mobile PWA share sheet (v2)
- Floor plan visual overlay (v2)
- AI-powered style recommendations
- Sharing boards with others (designer, contractor)
- Price tracking / alerts
- Multi-currency support
- Import from existing Pinterest boards
- Comparison view (side-by-side pins)

---

## 8. Success Criteria

- Can pin an image from any online shop in under 5 seconds
- All pins are searchable and organized by room within the gallery
- Budget tracking gives an at-a-glance view of spend per room
- The app feels delightful to use — not a chore, but a tool Tara actually enjoys browsing

---

## 9. Open Questions

- [x] ~~Floor plan details~~ — RESOLVED: T2 Dto, 8 boards pre-seeded (see Section 5)
- [ ] Preferred currency handling — EUR only, or support for GBP/USD shops with conversion?
- [ ] Domain name — sunset-design.com? Or a subdomain/path off an existing domain?
- [ ] Any specific Portuguese shops Tara already browses? (helps test auto-detection)
- [ ] Estimated delivery: June 2026 — app should be ready for shopping before then

---

*This is a living document. Updated as decisions are made during development.*
