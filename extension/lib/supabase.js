import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_BUCKET, SNAPSHOT_BUCKET } from './config.js'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

// Fetch all boards (for the board selector dropdown)
export async function fetchBoards() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/boards?order=sort_order.asc`, { headers })
  if (!res.ok) throw new Error('Failed to fetch boards')
  return res.json()
}

// Fetch all existing tags (for autocomplete)
export async function fetchTags() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pin_tags?select=tag&order=tag.asc`, { headers })
  if (!res.ok) throw new Error('Failed to fetch tags')
  const rows = await res.json()
  return [...new Set(rows.map(r => r.tag))]
}

// Upload an image to Supabase Storage
export async function uploadImage(bucket, fileName, blob) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': blob.type || 'image/png',
      'x-upsert': 'true'
    },
    body: blob
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Upload failed: ${err}`)
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`
}

// Insert a pin record
export async function insertPin(pin) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pins`, {
    method: 'POST',
    headers,
    body: JSON.stringify(pin)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Insert pin failed: ${err}`)
  }
  const rows = await res.json()
  return rows[0]
}

// Insert tags for a pin
export async function insertTags(pinId, tags) {
  if (!tags || tags.length === 0) return
  const rows = tags.map(tag => ({ pin_id: pinId, tag: tag.toLowerCase().trim() }))
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pin_tags`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Insert tags failed: ${err}`)
  }
}

// Upload pin image from a URL (fetch the image, then upload to storage)
export async function uploadImageFromUrl(imageUrl) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl}`)
  const blob = await res.blob()
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const fileName = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  return uploadImage(STORAGE_BUCKET, fileName, blob)
}

// Upload a page snapshot (full-page screenshot)
export async function uploadSnapshot(dataUrl) {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const fileName = `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
  return uploadImage(SNAPSHOT_BUCKET, fileName, blob)
}
