// Content script — runs on every page
// Provides: image detection, metadata scraping, .pt VPN detection

(function () {
  // Respond to messages from the popup or background script
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_PAGE_IMAGES') {
      sendResponse(getPageImages())
    } else if (msg.type === 'GET_PAGE_META') {
      sendResponse(getPageMeta())
    }
    return true
  })

  // Gather all meaningful images on the page
  function getPageImages() {
    const seen = new Set()
    const images = []
    const MIN_SIZE = 120

    document.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src
      if (!src || src.startsWith('data:') || seen.has(src)) return

      // Filter out tiny icons/spacers
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      if (w > 0 && w < MIN_SIZE && h > 0 && h < MIN_SIZE) return

      seen.add(src)
      images.push({
        src,
        alt: img.alt || '',
        width: w,
        height: h
      })
    })

    // Also check background images on common product containers
    document.querySelectorAll('[style*="background-image"]').forEach(el => {
      const match = el.style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
      if (match && !match[1].startsWith('data:') && !seen.has(match[1])) {
        seen.add(match[1])
        images.push({ src: match[1], alt: '', width: 0, height: 0 })
      }
    })

    return images
  }

  // Scrape product metadata from the current page
  function getPageMeta() {
    const meta = {
      productName: null,
      price: null,
      currency: null,
      storeName: null,
      pageUrl: window.location.href,
      pageTitle: document.title,
      requiresVpn: isLikelyVpnSite()
    }

    // 1. Try JSON-LD structured data
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent)
        const product = findProduct(data)
        if (product) {
          meta.productName = meta.productName || product.name
          if (product.offers) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
            meta.price = meta.price || parseFloat(offer.price)
            meta.currency = meta.currency || offer.priceCurrency
          }
        }
      } catch (_) { /* ignore malformed JSON-LD */ }
    })

    // 2. Try Open Graph / meta tags
    if (!meta.productName) {
      meta.productName = getMetaContent('og:title') || getMetaContent('twitter:title')
    }
    if (!meta.price) {
      const ogPrice = getMetaContent('product:price:amount') || getMetaContent('og:price:amount')
      if (ogPrice) meta.price = parseFloat(ogPrice)
    }
    if (!meta.currency) {
      meta.currency = getMetaContent('product:price:currency') || getMetaContent('og:price:currency')
    }
    if (!meta.storeName) {
      meta.storeName = getMetaContent('og:site_name')
    }

    // 3. Try common price selectors as fallback
    if (!meta.price) {
      const priceSelectors = [
        '[data-price]', '.price', '.product-price', '#price',
        '[itemprop="price"]', '.current-price', '.sale-price',
        '.offer-price', '.pdp-price', '.product__price'
      ]
      for (const sel of priceSelectors) {
        const el = document.querySelector(sel)
        if (el) {
          const priceAttr = el.getAttribute('data-price') || el.getAttribute('content')
          if (priceAttr) {
            meta.price = parseFloat(priceAttr)
            break
          }
          const text = el.textContent.trim()
          const match = text.match(/[\d.,]+/)
          if (match) {
            meta.price = parseFloat(match[0].replace(/[.,](?=\d{3})/g, '').replace(',', '.'))
            break
          }
        }
      }
    }

    // 4. Product name fallback: h1
    if (!meta.productName) {
      const h1 = document.querySelector('h1')
      if (h1) meta.productName = h1.textContent.trim()
    }

    // 5. Store name fallback: domain
    if (!meta.storeName) {
      meta.storeName = formatDomain(window.location.hostname)
    }

    return meta
  }

  // Recursively find a Product in JSON-LD (may be nested in @graph)
  function findProduct(data) {
    if (!data) return null
    if (Array.isArray(data)) {
      for (const item of data) {
        const found = findProduct(item)
        if (found) return found
      }
      return null
    }
    if (data['@type'] === 'Product' || data['@type'] === 'IndividualProduct') return data
    if (data['@graph']) return findProduct(data['@graph'])
    return null
  }

  function getMetaContent(property) {
    const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
    return el ? el.getAttribute('content') : null
  }

  function formatDomain(hostname) {
    return hostname.replace(/^www\./, '').split('.').slice(0, -1).join('.')
      .split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  function isLikelyVpnSite() {
    const hostname = window.location.hostname.toLowerCase()
    return hostname.endsWith('.pt')
  }

  // Scrape detailed product info for VPN page caching
  window.__sunsetDesignScrapeDetails = function () {
    const details = { description: null, specs: null, full_price_text: null }

    // Description
    const descSelectors = [
      '[itemprop="description"]', '.product-description', '.pdp-description',
      '#product-description', '.product__description', '.product-detail__description'
    ]
    for (const sel of descSelectors) {
      const el = document.querySelector(sel)
      if (el) { details.description = el.textContent.trim().slice(0, 2000); break }
    }

    // Specs / dimensions
    const specSelectors = [
      '.product-specs', '.specifications', '#specifications',
      '[data-testid="specifications"]', '.product-attributes'
    ]
    for (const sel of specSelectors) {
      const el = document.querySelector(sel)
      if (el) { details.specs = el.textContent.trim().slice(0, 2000); break }
    }

    // Full price text (with currency symbol)
    const priceEl = document.querySelector('[itemprop="price"], .price, .product-price, #price')
    if (priceEl) details.full_price_text = priceEl.textContent.trim()

    return details
  }
})()
