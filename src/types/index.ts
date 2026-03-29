export type PinStatus = 'wishlist' | 'shortlisted' | 'ordered' | 'arrived' | 'installed' | 'rejected'

export interface Board {
  id: string
  name: string
  slug: string
  cover_image_url: string | null
  budget_eur: number | null
  area_sqm: number | null
  orientation: string | null
  sort_order: number
  created_at: string
}

export interface Dimensions {
  w: number | null
  h: number | null
  d: number | null
  unit: string
}

export interface CachedProductDetails {
  description?: string
  specs?: string
  full_price_text?: string
}

export type Currency = 'EUR' | 'USD'

export interface Pin {
  id: string
  board_id: string
  image_url: string
  source_url: string
  store_name: string | null
  product_name: string | null
  price_eur: number | null
  price_currency: Currency
  exchange_rate: number | null
  dimensions: Dimensions | null
  notes: string | null
  status: PinStatus
  requires_vpn: boolean
  page_snapshot_url: string | null
  cached_product_details: CachedProductDetails | null
  created_at: string
  updated_at: string
  tags?: string[]
}

export interface PinTag {
  pin_id: string
  tag: string
}

export interface BoardWithPins extends Board {
  pins: Pin[]
  pin_count: number
  total_spent: number
  wishlist_total: number
}

export interface InspoImage {
  id: string
  image_url: string
  source_url: string | null
  caption: string | null
  created_at: string
  updated_at: string
}

export interface BudgetSummary {
  board_id: string
  board_name: string
  budget_eur: number | null
  wishlist_total: number
  committed_total: number
  installed_total: number
  pin_count: number
}
