# Sunset Design — Design Document

**Version:** 1.0
**Date:** 2026-03-28
**Status:** Draft
**Design System:** Algarve Twilight

---

## 1. Creative North Star: "The Atlantic Veranda"

Sunset Design captures the intersection of rugged coastal energy and high-fashion European sophistication. The creative north star is **"The Atlantic Veranda"** — a concept that balances the intense, fleeting heat of a Portuguese sunset against the structured, cool shadows of a luxury estate.

This is not a dashboard. It is a curated digital experience — an editorial spread for your Ericeira condo. Headlines breathe. Elements layer like fine paper on a stone table. Nothing is boxed in.

**Design references:**
- Algarve Twilight design system (Stitch) — color, type, components
- quiescent.dev — clean spatial rhythm, alternating sections
- teasetea.com — feminine warmth, generous whitespace, editorial energy
- kyliecosmetics.com — product card info patterns, category grid navigation

---

## 2. Color System: Algarve Twilight

A high-contrast dialogue between the searing heat of the sun and the depth of the ocean.

### Color Tokens

| Token | Hex | Role |
|-------|-----|------|
| **Primary** | `#FF7E5F` | Sunset coral — headlines, active states, CTAs |
| **Primary Dark** | `#a13920` | Deep terracotta — gradient start, emphasis |
| **Primary Container** | `#fe7d5e` | Warm coral — gradient end, badges |
| **Primary on** | `#ffefec` | Light blush — text on primary fills |
| **Secondary** | `#001F3F` | Deep Atlantic navy — contrast sections, depth |
| **Secondary tints** | Blue-gray range | Supporting cool tones for balance |
| **Tertiary** | `#D4AF37` | Golden Ochre — "gold leaf" accent, focus states |
| **Neutral / Surface** | `#FDFBF7` | Warm off-white cream — base background |
| **Surface** | `#f8f6f2` | Sandy background — the "sand" |
| **Surface Container Low** | Light sand | Large content sections |
| **Surface Container Lowest** | `#ffffff` | Cards — crisp lift against sand |
| **Surface Container High** | Recessed sand-gray | Search bars, utility trays |
| **On-Surface** | `#2e2f2d` | Near-black ink — body text (never pure #000) |
| **On-Surface Variant** | `#5b5c59` | Muted charcoal — secondary text |
| **Outline Variant** | `#aeadaa` | Ghost borders at 15% opacity |

### Status Colors (Warm Tonal Shifts)

| State | Color | Notes |
|-------|-------|-------|
| **Success** | Muted sage/olive green | "Installed" status, confirmations |
| **Warning** | Golden Ochre (`#D4AF37`) | Attention states, budget alerts |
| **Error** | Deep terracotta (`#a13920`) | Darker than primary — errors, delete confirmations |

### The "No-Line" Rule

Explicit: **1px solid borders for sectioning are strictly prohibited.** Boundaries are defined solely through background shifts. A `surface-container-low` section on a `surface` background creates a natural, sophisticated break without the cheapness of a stroke.

### Glass & Gradient (The "Soul" Rule)

- **CTA Gradient:** Linear gradient from `#a13920` → `#fe7d5e` at 135 degrees
- **Glassmorphism (floating elements):** `surface` at 70% opacity + 20px backdrop blur
- Sunset tones bleed through the UI, softening the high contrast

---

## 3. Typography: Editorial Authority

### Font Pairing

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| **Display & Headlines** | Noto Serif | 400–700 | The "hooks" — editorial, high-fashion masthead feel |
| **UI & Navigation** | Manrope | 400–600 | Clean, precise counterpoint to the serif |

### Type Scale

| Token | Size | Font | Use |
|-------|------|------|-----|
| `display-lg` | 3.5rem | Noto Serif | Hero headlines, room names |
| `display-md` | 2.5rem | Noto Serif | Section titles |
| `heading-lg` | 2rem | Noto Serif | Board titles, feature headings |
| `heading-md` | 1.5rem | Noto Serif | Card titles, sub-sections |
| `body-lg` | 1.125rem | Manrope | Primary body text |
| `body-md` | 1rem | Manrope | Standard body text |
| `label-lg` | 0.875rem | Manrope 600 | Navigation items, button text |
| `label-md` | 0.75rem | Manrope 500 | Tags, metadata, captions |

### Text Casing

- **Headlines:** Title case (natural, editorial)
- **Body:** Sentence case
- **Navigation & labels:** Sentence case
- **No all-lowercase or all-uppercase as a design pattern**

### Tonal Hierarchy

- Use `primary` (`#a13920`) for key headlines to pull the eye
- Use `on-surface-variant` (`#5b5c59`) for body text — soft, readable contrast against sand
- Never use pure black (`#000000`) — use `on-surface` (`#2e2f2d`) for premium ink-on-paper feel

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "software-standard." We use light to define space.

### The Layering Principle

Depth = stacking surface-container tiers. A `surface-container-lowest` card on a `surface-container-low` section creates a soft, natural lift like fine paper on a stone table.

### Ambient Shadows (Floating Elements Only)

When a floating element (FAB, popover, modal) needs a shadow:
- **Blur:** 40px–60px
- **Opacity:** 4%–6%
- **Color:** Tinted `on-surface` (`#2e2f2d`) — never pure black
- Must feel like natural Atlantic light, not a software UI

### Ghost Border Fallback

Where accessibility requires a container edge:
- **Token:** `outline-variant` (`#aeadaa`)
- **Opacity:** 15%
- **Weight:** 1px
- Never use 100% opaque borders

---

## 5. Layout & Responsive Strategy

### Desktop (Primary Experience)

**Navigation:** Solid vertical rail, Deep Atlantic Navy (#001F3F), flush left, full viewport height, w-16. Icons in white/90 (inactive) and white on gradient pill (active).
- Nav items: Home, Rooms, Search, Budget
- Currency toggle at rail bottom: EUR/USD button showing active currency highlighted. Golden dot warning when using fallback exchange rate.

**Content Area:**
- Full editorial layout with intentional asymmetry
- Masonry grid for pin feeds, editorial sections for room boards
- Large gaps: `spacing-10` (3.5rem) to `spacing-12` (4rem) vertical rhythm
- Asymmetric margins where appropriate (wide left, tight right) for dynamic energy

### Tablet (Adapted Experience)

- Floating rail collapses to a top horizontal nav bar (glassmorphic)
- Grid reduces to 2–3 columns
- Editorial asymmetry simplifies to centered layouts

### Mobile (Distinct Experience)

**This is a different UX, not a shrunken desktop.**

- **Navigation:** Solid Deep Atlantic Navy bottom tab bar.
  - Home | Rooms | Search | Budget | Currency Toggle
  - Active tab: white icon on gradient pill + label
  - Inactive tabs: white/90 outlined icons
  - Currency toggle at tab bar end: compact EUR/USD switcher
- **Feed:** Simplified card list — one card at a time, vertical scroll
- **Room entry:** Full-bleed room hero photos as tappable cards
- **Pin detail:** Full-screen overlay with swipe-to-dismiss
- **Add pin (from PWA share):** Streamlined metadata form

---

## 6. Navigation Structure

### Main Sections

| Tab | Desktop (Rail) | Mobile (Bottom Bar) | Content |
|-----|---------------|---------------------|---------|
| **Home** | House icon | House icon (filled gradient when active) | Recent pins, featured rooms, quick stats |
| **Rooms** | Grid icon | Grid icon | Room cards grid — tap to enter a room's board |
| **Search** | Magnifier icon | Magnifier icon | Full-text search, filter by tag/store/status/price |
| **Budget** | Chart icon | Chart icon | Donut chart, stacked bars, summary cards, configure section |

### Mood Board (Accessed from Rooms Page)

The Mood Board is a pure visual inspiration page, separate from product pins. It has no prices, stores, or status tracking -- just images with optional captions and source URLs.

- **Entry point:** A special "Mood Board" card appears as the last item in the Rooms page grid
- **Route:** `/mood-board`
- **Layout:** Masonry grid using CSS columns (`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4`) with `break-inside-avoid`. No library dependency.
- **Images:** Displayed at natural aspect ratio (no cropping)
- **Adding images:** Two modes via upload dialog -- "Browse URL" (scrapes images from any webpage via Edge Function, user picks from grid) and "Upload File" (drag-and-drop)
- **Lightbox:** Fullscreen image viewer with arrow key navigation, caption, source link, delete button
- **Delete:** Available via hover X on cards and trash icon in lightbox
- Not included in the nav bar -- accessed exclusively through the Rooms page

### Room Entry (Inspired by Kylie's Category Grid)

Entering "Rooms" shows a grid of large room hero photos (4:3 aspect ratio). The grid reflects the actual T2 Dto condo layout:

| Order | Board | Area | Orientation | Hero Image Vibe |
|-------|-------|------|-------------|-----------------|
| 1 | **Living & Dining** | 45.81 m² | West (sunset) | Golden hour light through large windows |
| 2 | **Kitchen** | 7.37 m² | Interior | Clean countertops, warm materials |
| 3 | **Primary Bedroom** | 17.06 m² | Interior/North | Serene, textile-rich |
| 4 | **Guest Bedroom** | 14.90 m² | Interior/North | Welcoming, bright |
| 5 | **Bathrooms** | 10.79 m² | Various | Ceramic, stone, clean lines |
| 6 | **Terrace** | 60.83 m² | East (morning sun) | Outdoor living, plants, Atlantic breeze |
| 7 | **Entry & Hallway** | 8.05 m² | Interior | First impression, warm welcome |
| 8 | **General Inspo** | N/A | N/A | Portuguese architecture, mood, texture |

Each card shows:
- Room name in `display-md` Noto Serif overlaid on the image
- Subtle gradient overlay for text readability (dark at bottom)
- Pin count and budget summary as small labels
- Room area in `label-md` (e.g., "45.81 m²")
- Tapping enters the room's board view

**Layout note:** Living & Dining should be the largest card (hero position) since it's the primary space with those west-facing sunset windows. Terrace is the second hero — 60.83 m² of east-facing outdoor space.

### Within a Room (Board View)

Based on the Stitch "Board View" screen:
- Room name as `display-lg` hero headline
- Room area + orientation as subtitle (e.g., "45.81 m² — West-facing, sunset views")
- Action buttons: "Add Item" (gradient primary CTA), share/export
- Sectioned content grouped by tag (e.g., "Lighting", "Textiles", "Art", "Furniture")
- Each section is a horizontal scrollable row or grid of pin cards
- "Foundations" section at bottom for materials/finishes (tiles, paint, flooring)
- Budget progress bar at the top of the room view

---

## 7. Components

### Pin Cards (Grid View)

Inspired by Kylie Cosmetics product cards:

**Structure (top to bottom):**
1. **Image** — 4:3 aspect ratio, cropped to fit. Rounded corners (`md` radius)
2. **Status badge** — Top-right corner pill: "Wishlist", "Ordered", "Installed" etc.
   - Wishlist: ghost border style
   - Ordered: primary gradient fill
   - Installed: sage green fill
3. **Product/item name** — `heading-md` Noto Serif, one line truncated
4. **Store name** — `label-md` Manrope in `on-surface-variant`
5. **Price** — `label-lg` Manrope, right-aligned, primary color

**Card surface:** `surface-container-lowest` (#ffffff), no border (layered on sand background)

**Active/Featured indicator:** 4px `primary` accent bar on left edge

**Hover (desktop):** Subtle scale-up (1.02x), ambient shadow fade-in

### Pin Detail View (Expanded)

Clicking a card opens a detail view:
- **Full uncropped image** — no aspect ratio restriction, shown at natural proportions
- All metadata: name, store, price, dimensions, notes, tags, status, source URL
- Status quick-change buttons (gradient pills)
- "Visit Store" link button (opens source URL)
- Edit all fields inline
- Room/board assignment
- Date pinned

### Buttons

| Type | Style | Use |
|------|-------|-----|
| **Primary** | Gradient fill (`#a13920` → `#fe7d5e` at 135deg), `md` radius, white text | Main CTAs: "Add Item", "Save Pin", "Visit Store" |
| **Secondary** | No fill, ghost border (15% opacity), primary text | Secondary actions: "Edit", "Move to Board" |
| **Tertiary** | Text only, primary color, underline on hover | Inline links, "View All", "See More" |
| **Inverted** | Dark fill (`#001F3F`), white text | Contrast CTAs on light sections |

### FAB (Floating Action Button)

- Gradient fill matching primary buttons
- Rounded square (like the Stitch + button)
- "+" icon for quick-add pin
- Ambient shadow (40px blur, 5% opacity, tinted)
- Bottom-right on desktop, integrated into bottom bar on mobile

### Search / Input Fields

- No border
- `surface-container-high` background fill
- 3px bottom-only border in `outline-variant`
- On focus: bottom border transitions to tertiary (Golden Ochre)
- Magnifier icon left-aligned, `on-surface-variant` color

### Tags

- Small pills with `surface-container-low` background
- `label-md` Manrope text in `on-surface-variant`
- On hover/active: primary color text, ghost border in primary
- Removable tags show an "x" on hover

### Status Pipeline Badges

| Status | Style |
|--------|-------|
| Wishlist | Ghost border, `on-surface-variant` text |
| Shortlisted | Golden Ochre ghost border, tertiary text |
| Ordered | Primary gradient fill, white text |
| Arrived | Primary solid fill (no gradient), white text |
| Installed | Sage green fill, white text |
| Rejected | `surface-container-high` fill, muted text, slightly transparent |

### Mood Board Components

**MoodBoardCard (Rooms page)**
- Special card shown as the last item in the Rooms grid
- Displays a collage preview of saved inspo images
- Tapping navigates to `/mood-board`

**InspoCard (Mood Board page)**
- Masonry card with natural aspect ratio (no cropping)
- Caption overlay at the bottom of the image
- Hover reveals a delete X button

**InspoAddCard**
- Dashed "+" placeholder card in the masonry grid
- Opens the InspoUploadDialog on click

**InspoUploadDialog**
- Two-mode dialog: "Browse URL" and "Upload File"
- Browse URL: paste any URL, Edge Function scrapes images, user picks from a grid of results
- Upload File: drag-and-drop file upload
- Selected/uploaded images become InspoCards on the Mood Board

**InspoLightbox**
- Fullscreen image viewer overlay
- Arrow key navigation between images
- Displays caption and source link
- Delete button (trash icon) for removing images

### Budget Components (Recharts)

**BudgetDonut**
- Recharts `PieChart` with inner/outer radius creating a donut
- Each slice = one room's committed spend (ordered + arrived + installed)
- Warm color palette derived from Algarve Twilight tokens
- Center label shows total committed spend
- Legend below with room names and amounts

**BudgetStackedBar**
- Recharts `BarChart` with one stacked bar per room
- Three segments: installed (sage), ordered (primary gradient), wishlist (ghost/outline)
- Vertical budget marker line showing the room's budget limit
- Room name and total as axis label

**BudgetConfigure**
- Collapsible section toggled by a "Configure Budgets" button
- Master budget input at top, stored in `app_settings` table
- Per-room budget inputs using existing `boards.budget_eur` column
- Allocation summary: shows "Over budget by X" (error terracotta) or "X unallocated" (muted) when room allocations vs master budget don't match
- Inputs styled per search/input field spec (no border, surface-container-high fill, bottom-border focus)

**Budget Summary Cards**
- Colored left accent bar (4px) per card — primary coral for total, sage for installed, etc.
- Key metrics: total committed, total budget, per-status breakdowns
- `surface-container-lowest` card surface, matching pin card treatment

### Currency Toggle

**CurrencyToggle (Nav)**
- Compact button showing "EUR" and "USD" with the active currency highlighted in white/bold
- Positioned at the bottom of the desktop rail, end of mobile tab bar
- Golden dot indicator (tertiary `#D4AF37`) when using fallback exchange rate (API unavailable)
- Tapping switches the global display currency via `CurrencyContext`

**Currency Picker (PinDetailView)**
- Dropdown next to the price input field in edit mode: EUR or USD
- When USD is selected, an exchange rate input appears below with a "Use live rate" button
- Exchange rate locks automatically when pin status moves to "ordered"

---

## 8. Motion & Transitions

**Philosophy:** Subtle and smooth. Nothing flashy — just polished. Every transition should feel like turning a page in a beautiful magazine.

### Timing

| Type | Duration | Easing |
|------|----------|--------|
| Hover states | 200ms | ease-out |
| Page transitions | 300ms | ease-in-out |
| Card entrance (staggered) | 150ms per card | ease-out |
| Modal open/close | 250ms | ease-out / ease-in |
| Status change | 200ms | ease-out |

### Specific Animations

- **Card hover (desktop):** Scale to 1.02x + ambient shadow fade-in
- **Page/room transition:** Gentle crossfade (opacity 0→1)
- **Pin save confirmation:** Soft checkmark fade-in on the card
- **Cards entering viewport:** Subtle fade-up (translateY 12px → 0, opacity 0 → 1), staggered 50ms between cards
- **Bottom nav (mobile):** Active icon fills with gradient, smooth color transition
- **Modal/detail view:** Slide up from bottom on mobile, fade-scale on desktop
- **Budget progress bar:** Smooth width transition when values update

### No-Go Animations

- No bounce/spring physics
- No parallax scrolling
- No 3D transforms
- No attention-seeking pulses or shakes

---

## 9. Image Treatment

### Grid Thumbnails

- **Aspect ratio:** 4:3 landscape (cropped to fit)
- **Corner radius:** `md` (0.375rem), matching button radius
- **No filters or color overlays** — images shown naturally as captured from source
- **Object-fit:** cover (center-crop)

### Detail View

- **Full uncropped image** at natural aspect ratio
- No maximum height restriction — scroll to see full image
- Pinch-to-zoom on mobile

### Room Hero Images

- Full-bleed, 16:9 or wider aspect ratio
- Subtle dark gradient overlay at bottom (for text readability)
- These should be curated "best" photos representing each room's vibe

---

## 10. Spacing & Rhythm

We avoid the "tight" feel of productivity apps. This is editorial.

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `spacing-2` | 0.5rem | Tight: tag gaps, icon padding |
| `spacing-4` | 1rem | Standard: label-to-content, input padding |
| `spacing-6` | 2rem | Card internal padding, list item separation |
| `spacing-8` | 2.75rem | Section sub-divisions |
| `spacing-10` | 3.5rem | Standard vertical rhythm between sections |
| `spacing-12` | 4rem | Large section breaks |
| `spacing-24` | 6rem | Asymmetric wide margins (editorial layouts) |

### Grid

| Breakpoint | Columns | Gap | Margins |
|------------|---------|-----|---------|
| Desktop (1200px+) | 4 | `spacing-6` | Asymmetric (wide left for rail nav) |
| Tablet (768–1199px) | 2–3 | `spacing-4` | Centered, `spacing-8` |
| Mobile (<768px) | 1 | `spacing-4` | `spacing-4` |

### The Breathing Rule

No section should feel "packed." When in doubt, add more space. The sand-colored background is part of the design — let it show.

---

## 11. Do's and Don'ts

### Do

- Let Noto Serif headlines overlap images or container edges where it creates editorial drama
- Use Golden Ochre (`#D4AF37`) sparingly as a "gold leaf" accent for icons or small labels
- Leverage large amounts of sand space to make the sunset coral pop
- Use the gradient (primary → primary-container) as the signature visual element
- Let the glassmorphism nav feel like you're looking through a veranda onto the content
- Use tonal surface shifts to create section boundaries

### Don't

- Use pure black (`#000000`) for anything — use `on-surface` (`#2e2f2d`)
- Use standard/default shadows — if it looks like Material UI defaults, it's wrong
- Box everything in — let elements float and breathe
- Use 100% opaque borders — ever
- Use harsh status colors (neon green, bright red) — keep everything warm-shifted
- Add jarring animations — keep motion subtle and polished
- Sacrifice the editorial feel for "more features on screen"

---

## 12. Accessibility Notes

- All text meets WCAG 2.1 AA contrast ratios against their background surfaces
- `on-surface` (`#2e2f2d`) on `surface` (`#f8f6f2`) = 11.5:1 contrast (exceeds AAA)
- Primary (`#FF7E5F`) used for decoration/emphasis only, not as sole indicator
- Status badges use both color AND text labels
- Ghost borders at 15% opacity are decorative only — not relied upon for meaning
- Focus states use Golden Ochre border (3px) for high visibility
- Touch targets: minimum 44x44px on mobile

---

*This is a living document. Updated as the design evolves during development.*
