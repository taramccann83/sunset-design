// Popup panel: shows images on the current page, lets you select + save
// Self-contained — no module imports

const SUPABASE_URL = 'https://ijusthxxbsjwetoijhrm.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_AaJazyqqM66dHWx7ykFS4w_I8-RXmS0'
const STORAGE_BUCKET = 'pin-images'

const supaHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

let selectedImages = new Set()
const selectedTags = new Set()
let pageMeta = {}

const $ = (sel) => document.querySelector(sel)

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) return

  $('#pageUrl').textContent = new URL(tab.url).hostname

  // Load boards, tags, and page data in parallel
  const [boardsRes, tagsRes, images, meta] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/boards?order=sort_order.asc`, { headers: supaHeaders }),
    fetch(`${SUPABASE_URL}/rest/v1/pin_tags?select=tag&order=tag.asc`, { headers: supaHeaders }),
    chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_IMAGES' }),
    chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_META' })
  ])

  const boards = await boardsRes.json()
  const tagRows = await tagsRes.json()
  pageMeta = meta || {}

  // Populate board dropdown
  const boardSelect = $('#boardSelect')
  ;(boards || []).forEach(b => {
    const opt = document.createElement('option')
    opt.value = b.id
    opt.textContent = b.name
    boardSelect.appendChild(opt)
  })

  // Render existing tags as clickable pills
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

  // Handle Enter key in tag input to add new tags
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
      pillsContainer.appendChild(pill)
      input.value = ''
    }
  })

  // Pre-fill form from scraped metadata
  if (pageMeta.storeName) $('#storeInput').value = pageMeta.storeName
  if (pageMeta.productName) $('#productInput').value = pageMeta.productName
  if (pageMeta.price) $('#priceInput').value = pageMeta.price
  if (pageMeta.currency === 'USD') $('#currencySelect').value = 'USD'
  if (pageMeta.requiresVpn) {
    $('#vpnToggle').checked = true
    $('#vpnNotice').style.display = 'block'
  }

  renderImages(images || [])

  $('#nextBtn').addEventListener('click', showForm)
  $('#backBtn').addEventListener('click', showGrid)
  $('#saveBtn').addEventListener('click', handleSave)
  $('#vpnToggle').addEventListener('change', () => {
    $('#vpnNotice').style.display = $('#vpnToggle').checked ? 'block' : 'none'
  })
})

function renderImages(images) {
  const grid = $('#images')

  if (images.length === 0) {
    $('#noImages').style.display = 'block'
    $('#nextBtn').style.display = 'none'
    return
  }

  images.forEach((img, i) => {
    const card = document.createElement('div')
    card.className = 'image-card'
    card.dataset.index = i

    const imgEl = document.createElement('img')
    imgEl.src = img.src
    imgEl.alt = img.alt
    imgEl.loading = 'lazy'

    const check = document.createElement('div')
    check.className = 'image-check'
    check.innerHTML = '&#10003;'

    card.appendChild(imgEl)
    card.appendChild(check)
    grid.appendChild(card)

    card.addEventListener('click', () => {
      if (selectedImages.has(img.src)) {
        selectedImages.delete(img.src)
        card.classList.remove('selected')
      } else {
        selectedImages.add(img.src)
        card.classList.add('selected')
      }
      updateNextButton()
    })
  })
}

function updateNextButton() {
  const btn = $('#nextBtn')
  const count = selectedImages.size
  btn.disabled = count === 0
  $('#selectedCount').textContent = count > 0 ? `(${count})` : ''
}

function showForm() {
  $('#imageGrid').style.display = 'none'
  $('#metaForm').style.display = 'block'

  if (selectedImages.size === 1) {
    $('#priceInput').parentElement.style.display = ''
    $('#productInput').parentElement.style.display = ''
    $('#notesInput').parentElement.style.display = ''
  } else {
    $('#priceInput').parentElement.style.display = 'none'
    $('#productInput').parentElement.style.display = 'none'
    $('#notesInput').parentElement.style.display = 'none'
  }
}

function showGrid() {
  $('#imageGrid').style.display = 'block'
  $('#metaForm').style.display = 'none'
  $('#successState').style.display = 'none'
  $('#errorState').style.display = 'none'
  $('#savingState').style.display = 'none'
  $('#saveBtn').style.display = ''
}

async function handleSave() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const imageUrls = [...selectedImages]
  const boardId = $('#boardSelect').value
  const status = $('#statusSelect').value
  const tags = [...selectedTags]
  const requiresVpn = $('#vpnToggle').checked

  $('#saveBtn').style.display = 'none'
  $('#savingState').style.display = 'flex'
  $('#errorState').style.display = 'none'

  try {
    for (const imageUrl of imageUrls) {
      // Download image
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`)
      const blob = await imgRes.blob()

      // Upload to Supabase Storage
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
      if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`)
      const storedImageUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`

      // Insert pin
      const pinData = {
        board_id: boardId,
        image_url: storedImageUrl,
        source_url: tab.url,
        store_name: $('#storeInput').value || null,
        status: status || 'wishlist',
        requires_vpn: requiresVpn
      }
      if (imageUrls.length === 1) {
        pinData.product_name = $('#productInput').value || null
        pinData.price_eur = parseFloat($('#priceInput').value) || null
        pinData.price_currency = $('#currencySelect').value || 'EUR'
        pinData.notes = $('#notesInput').value || null
      }

      const pinRes = await fetch(`${SUPABASE_URL}/rest/v1/pins`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify(pinData)
      })
      if (!pinRes.ok) throw new Error(`Insert failed: ${await pinRes.text()}`)
      const [pin] = await pinRes.json()

      // Insert tags
      if (tags.length > 0) {
        const tagRows = tags.map(tag => ({ pin_id: pin.id, tag }))
        await fetch(`${SUPABASE_URL}/rest/v1/pin_tags`, {
          method: 'POST',
          headers: supaHeaders,
          body: JSON.stringify(tagRows)
        })
      }
    }

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
}
