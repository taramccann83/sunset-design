import { fetchBoards, uploadImageFromUrl, uploadSnapshot, insertPin, insertTags } from './lib/supabase.js'

// Set up the right-click context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pin-to-sunset',
    title: 'Pin to Sunset Design',
    contexts: ['image']
  })
})

// Handle right-click on an image
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'pin-to-sunset') return

  // Get page metadata from the content script
  const meta = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_META' })

  // Store the context for the popup to pick up
  await chrome.storage.local.set({
    pendingPin: {
      imageUrl: info.srcUrl,
      pageUrl: info.pageUrl || tab.url,
      meta
    }
  })

  // Open the popup for the user to confirm/edit metadata
  // We use a small window since action.openPopup() isn't available in all Chrome versions
  chrome.windows.create({
    url: chrome.runtime.getURL('confirm.html'),
    type: 'popup',
    width: 420,
    height: 640,
    focused: true
  })
})

// Handle messages from popup / confirm window
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[Sunset] Message received:', msg.type)

  if (msg.type === 'SAVE_PIN') {
    console.log('[Sunset] SAVE_PIN payload:', JSON.stringify(msg.payload).slice(0, 200))
    handleSavePin(msg.payload, sender.tab?.id).then(result => {
      console.log('[Sunset] SAVE_PIN success:', result)
      sendResponse(result)
    }).catch(err => {
      console.error('[Sunset] SAVE_PIN error:', err)
      sendResponse({ error: err.message })
    })
    return true // keep channel open for async response
  }

  if (msg.type === 'SAVE_PINS_BATCH') {
    handleSavePinsBatch(msg.payload, sender.tab?.id).then(sendResponse).catch(err => {
      sendResponse({ error: err.message })
    })
    return true
  }

  if (msg.type === 'CAPTURE_FULL_PAGE') {
    handleFullPageCapture(msg.tabId).then(sendResponse).catch(err => {
      sendResponse({ error: err.message })
    })
    return true
  }

  if (msg.type === 'GET_BOARDS') {
    fetchBoards().then(sendResponse).catch(err => {
      sendResponse({ error: err.message })
    })
    return true
  }
})

// Save a single pin
async function handleSavePin(payload) {
  const { imageUrl, boardId, productName, price, currency, storeName, tags, notes, status, requiresVpn, pageUrl, cachedProductDetails, snapshotDataUrl } = payload

  // Upload the image to Supabase Storage
  const storedImageUrl = await uploadImageFromUrl(imageUrl)

  // Upload page snapshot if VPN-flagged
  let pageSnapshotUrl = null
  if (requiresVpn && snapshotDataUrl) {
    pageSnapshotUrl = await uploadSnapshot(snapshotDataUrl)
  }

  // Insert the pin
  const pin = await insertPin({
    board_id: boardId,
    image_url: storedImageUrl,
    source_url: pageUrl,
    store_name: storeName || null,
    product_name: productName || null,
    price_eur: price || null,
    price_currency: currency || 'EUR',
    status: status || 'wishlist',
    requires_vpn: requiresVpn || false,
    page_snapshot_url: pageSnapshotUrl,
    cached_product_details: cachedProductDetails || null,
    notes: notes || null
  })

  // Insert tags
  if (tags && tags.length > 0) {
    await insertTags(pin.id, tags)
  }

  return { success: true, pin }
}

// Save multiple pins (batch from popup multi-select)
async function handleSavePinsBatch(payload) {
  const { imageUrls, boardId, tags, status, requiresVpn, pageUrl, storeName } = payload
  const results = []

  for (const imageUrl of imageUrls) {
    try {
      const storedImageUrl = await uploadImageFromUrl(imageUrl)
      const pin = await insertPin({
        board_id: boardId,
        image_url: storedImageUrl,
        source_url: pageUrl,
        store_name: storeName || null,
        status: status || 'wishlist',
        requires_vpn: requiresVpn || false
      })
      if (tags && tags.length > 0) {
        await insertTags(pin.id, tags)
      }
      results.push({ success: true, pin })
    } catch (err) {
      results.push({ success: false, error: err.message, imageUrl })
    }
  }

  return { results }
}

// Full-page screenshot: scroll through the page, capture each viewport, stitch together
async function handleFullPageCapture(tabId) {
  // Get page dimensions
  const [{ result: dims }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    })
  })

  const { scrollWidth, scrollHeight, viewportWidth, viewportHeight } = dims
  const captures = []
  let y = 0

  // Scroll and capture each viewport-sized chunk
  while (y < scrollHeight) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (scrollY) => window.scrollTo(0, scrollY),
      args: [y]
    })

    // Small delay for rendering
    await new Promise(r => setTimeout(r, 150))

    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' })
    captures.push({ dataUrl, y })

    y += viewportHeight
  }

  // Scroll back to top
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.scrollTo(0, 0)
  })

  // If only one capture, return it directly
  if (captures.length === 1) {
    return { dataUrl: captures[0].dataUrl }
  }

  // Stitch captures together using OffscreenDocument
  const stitchedDataUrl = await stitchCaptures(captures, scrollWidth, scrollHeight, viewportHeight)
  return { dataUrl: stitchedDataUrl }
}

// Stitch multiple viewport captures into one tall image
async function stitchCaptures(captures, width, totalHeight, viewportHeight) {
  // Use an offscreen document for canvas operations (MV3 requirement)
  const existingContexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CANVAS'],
      justification: 'Stitching full-page screenshot captures'
    })
  }

  const result = await chrome.runtime.sendMessage({
    type: 'STITCH_IMAGES',
    captures,
    width,
    totalHeight,
    viewportHeight
  })

  return result.dataUrl
}
