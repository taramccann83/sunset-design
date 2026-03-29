// Confirm window: appears after right-clicking an image -> "Pin to Sunset Design"
// Self-contained — no module imports (avoids ES module issues in extension pages)

const SUPABASE_URL = 'https://ijusthxxbsjwetoijhrm.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_AaJazyqqM66dHWx7ykFS4w_I8-RXmS0'
const STORAGE_BUCKET = 'pin-images'

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

const $ = (sel) => document.querySelector(sel)

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Sunset] confirm.js loaded')

  // Load pending pin data set by the background script
  const { pendingPin } = await chrome.storage.local.get('pendingPin')
  if (!pendingPin) {
    document.body.innerHTML = '<p style="padding:24px;font-family:Manrope">No image selected. Try right-clicking an image first.</p>'
    return
  }

  const { imageUrl, pageUrl, meta } = pendingPin
  console.log('[Sunset] Pending pin loaded:', imageUrl?.slice(0, 80))

  // Show preview
  $('#previewImage').src = imageUrl

  // Load boards from Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/boards?order=sort_order.asc`, { headers })
    const boards = await res.json()
    console.log('[Sunset] Boards loaded:', boards.length)
    const boardSelect = $('#boardSelect')
    boards.forEach(b => {
      const opt = document.createElement('option')
      opt.value = b.id
      opt.textContent = b.name
      boardSelect.appendChild(opt)
    })
  } catch (err) {
    console.error('[Sunset] Failed to load boards:', err)
  }

  // Load existing tags and render as clickable pills
  const selectedTags = new Set()
  try {
    const tagRes = await fetch(`${SUPABASE_URL}/rest/v1/pin_tags?select=tag&order=tag.asc`, { headers })
    const tagRows = await tagRes.json()
    const allTags = [...new Set(tagRows.map(r => r.tag))].sort()
    const pillsContainer = $('#tagPills')
    allTags.forEach(tag => {
      const pill = document.createElement('button')
      pill.className = 'tag-pill'
      pill.textContent = tag
      pill.type = 'button'
      pill.addEventListener('click', () => {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag)
          pill.classList.remove('active')
        } else {
          selectedTags.add(tag)
          pill.classList.add('active')
        }
      })
      pillsContainer.appendChild(pill)
    })
  } catch (err) {
    console.error('[Sunset] Failed to load tags:', err)
  }

  // Handle Enter key in tag input to add new tags as pills
  $('#tagsInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const input = $('#tagsInput')
      const newTag = input.value.trim().toLowerCase()
      if (!newTag || selectedTags.has(newTag)) {
        input.value = ''
        return
      }
      selectedTags.add(newTag)
      const pill = document.createElement('button')
      pill.className = 'tag-pill active'
      pill.textContent = newTag
      pill.type = 'button'
      pill.addEventListener('click', () => {
        if (selectedTags.has(newTag)) {
          selectedTags.delete(newTag)
          pill.classList.remove('active')
        } else {
          selectedTags.add(newTag)
          pill.classList.add('active')
        }
      })
      $('#tagPills').appendChild(pill)
      input.value = ''
    }
  })

  // Pre-fill form from scraped metadata
  if (meta) {
    if (meta.storeName) $('#storeInput').value = meta.storeName
    if (meta.productName) $('#productInput').value = meta.productName
    if (meta.price) $('#priceInput').value = meta.price
    if (meta.currency === 'USD') $('#currencySelect').value = 'USD'
    if (meta.requiresVpn) {
      $('#vpnToggle').checked = true
      $('#vpnNotice').style.display = 'block'
    }
  }

  // VPN toggle
  $('#vpnToggle').addEventListener('change', () => {
    $('#vpnNotice').style.display = $('#vpnToggle').checked ? 'block' : 'none'
  })

  // Save button
  $('#saveBtn').addEventListener('click', async () => {
    console.log('[Sunset] Save button clicked')

    const tags = [...selectedTags]

    $('#saveBtn').style.display = 'none'
    $('#savingState').style.display = 'flex'
    $('#errorState').style.display = 'none'

    try {
      // Step 1: Download the image
      console.log('[Sunset] Fetching image:', imageUrl.slice(0, 100))
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`)
      const blob = await imgRes.blob()
      console.log('[Sunset] Image fetched, size:', blob.size, 'type:', blob.type)

      // Step 2: Upload to Supabase Storage
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      const fileName = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': blob.type || 'image/png',
          'x-upsert': 'true'
        },
        body: blob
      })
      if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        throw new Error(`Upload failed: ${errText}`)
      }
      const storedImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`
      console.log('[Sunset] Image uploaded:', storedImageUrl)

      // Step 3: Insert pin record
      const pinData = {
        board_id: $('#boardSelect').value,
        image_url: storedImageUrl,
        source_url: pageUrl,
        store_name: $('#storeInput').value || null,
        product_name: $('#productInput').value || null,
        price_eur: parseFloat($('#priceInput').value) || null,
        price_currency: $('#currencySelect').value || 'EUR',
        status: $('#statusSelect').value || 'wishlist',
        requires_vpn: $('#vpnToggle').checked,
        notes: $('#notesInput').value || null
      }

      console.log('[Sunset] Inserting pin:', JSON.stringify(pinData).slice(0, 200))
      const pinRes = await fetch(`${SUPABASE_URL}/rest/v1/pins`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pinData)
      })
      if (!pinRes.ok) {
        const errText = await pinRes.text()
        throw new Error(`Insert pin failed: ${errText}`)
      }
      const [pin] = await pinRes.json()
      console.log('[Sunset] Pin inserted:', pin.id)

      // Step 4: Insert tags
      if (tags.length > 0) {
        const tagRows = tags.map(tag => ({ pin_id: pin.id, tag: tag.toLowerCase().trim() }))
        await fetch(`${SUPABASE_URL}/rest/v1/pin_tags`, {
          method: 'POST',
          headers,
          body: JSON.stringify(tagRows)
        })
        console.log('[Sunset] Tags inserted:', tags)
      }

      // Clear pending data
      await chrome.storage.local.remove('pendingPin')

      $('#savingState').style.display = 'none'
      $('#successState').style.display = 'flex'
      setTimeout(() => window.close(), 1200)

    } catch (err) {
      console.error('[Sunset] Save failed:', err)
      $('#savingState').style.display = 'none'
      $('#errorState').textContent = err.message || 'Failed to save'
      $('#errorState').style.display = 'block'
      $('#saveBtn').style.display = ''
    }
  })
})
