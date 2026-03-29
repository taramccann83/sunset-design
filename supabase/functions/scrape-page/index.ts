import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let html: string
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
      clearTimeout(timeout)

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
        return new Response(
          JSON.stringify({ error: 'not_html', images: [], ogImage: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      html = await res.text()
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const msg = fetchErr instanceof Error ? fetchErr.message : 'fetch_failed'
      const errorType = msg.includes('abort') ? 'timeout' : 'fetch_failed'
      return new Response(
        JSON.stringify({ error: errorType, images: [], ogImage: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = new URL(url)
    const result = {
      images: extractImages(html, baseUrl),
      ogImage: extractMeta(html, 'og:image', baseUrl),
      productName: extractProductName(html),
      price: extractPrice(html),
      currency: extractCurrency(html),
      storeName: extractStoreName(html, baseUrl),
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function resolveUrl(src: string, base: URL): string | null {
  try {
    if (src.startsWith('data:') || src.startsWith('blob:')) return null
    return new URL(src, base.origin).href
  } catch {
    return null
  }
}

function extractImages(html: string, base: URL): string[] {
  const seen = new Set<string>()
  const images: string[] = []

  // OG image first
  const ogImg = extractMeta(html, 'og:image', base)
  if (ogImg) {
    seen.add(ogImg)
    images.push(ogImg)
  }

  // img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], base)
    if (resolved && !seen.has(resolved)) {
      // Skip tiny images (tracking pixels, icons)
      const widthMatch = match[0].match(/width=["']?(\d+)/)
      const heightMatch = match[0].match(/height=["']?(\d+)/)
      if (widthMatch && parseInt(widthMatch[1]) < 50) continue
      if (heightMatch && parseInt(heightMatch[1]) < 50) continue
      // Skip common non-product patterns
      if (resolved.includes('pixel') || resolved.includes('tracking') || resolved.includes('spacer')) continue

      seen.add(resolved)
      images.push(resolved)
    }
  }

  // srcset images (often higher quality)
  const srcsetRegex = /srcset=["']([^"']+)["']/gi
  while ((match = srcsetRegex.exec(html)) !== null) {
    const entries = match[1].split(',')
    for (const entry of entries) {
      const src = entry.trim().split(/\s+/)[0]
      const resolved = resolveUrl(src, base)
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved)
        images.push(resolved)
      }
    }
  }

  return images.slice(0, 20) // Cap at 20
}

function extractMeta(html: string, property: string, base: URL): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["']`,
    'i'
  )
  const match = html.match(regex)
  if (match) return resolveUrl(match[1], base)

  // Try reverse order (content before property)
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
    'i'
  )
  const match2 = html.match(regex2)
  if (match2) return resolveUrl(match2[1], base)

  return null
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      // Direct Product
      if (data['@type'] === 'Product') return data
      // Array of items
      if (Array.isArray(data)) {
        const product = data.find((d: Record<string, unknown>) => d['@type'] === 'Product')
        if (product) return product
      }
      // Graph
      if (data['@graph'] && Array.isArray(data['@graph'])) {
        const product = data['@graph'].find((d: Record<string, unknown>) => d['@type'] === 'Product')
        if (product) return product
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }
  return null
}

function extractProductName(html: string): string | null {
  // JSON-LD
  const jsonLd = extractJsonLd(html)
  if (jsonLd?.name) return String(jsonLd.name)

  // OG title
  const ogTitle = extractMetaContent(html, 'og:title')
  if (ogTitle) return ogTitle

  // HTML title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    // Clean up title (remove store name suffix)
    let title = titleMatch[1].trim()
    title = title.replace(/\s*[|\-–]\s*[^|\-–]+$/, '').trim()
    if (title) return title
  }

  return null
}

function extractPrice(html: string): number | null {
  // JSON-LD
  const jsonLd = extractJsonLd(html)
  if (jsonLd?.offers) {
    const offers = jsonLd.offers as Record<string, unknown>
    const price = offers.price || (offers as Record<string, unknown>).lowPrice
    if (price) {
      const num = parseFloat(String(price))
      if (!isNaN(num)) return num
    }
    // Array of offers
    if (Array.isArray(offers)) {
      for (const offer of offers) {
        if (offer.price) {
          const num = parseFloat(String(offer.price))
          if (!isNaN(num)) return num
        }
      }
    }
  }

  // Meta tags
  const priceMeta = extractMetaContent(html, 'product:price:amount')
  if (priceMeta) {
    const num = parseFloat(priceMeta)
    if (!isNaN(num)) return num
  }

  // Common price patterns in HTML
  const pricePatterns = [
    /class=["'][^"']*price[^"']*["'][^>]*>[\s]*[^<]*?([\d.,]+)/i,
    /data-price=["']([\d.,]+)["']/i,
    /itemprop=["']price["'][^>]*content=["']([\d.,]+)["']/i,
  ]
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match) {
      // Handle European format (1.234,56) vs US format (1,234.56)
      let priceStr = match[1]
      if (priceStr.includes(',') && priceStr.includes('.')) {
        // Check which is the decimal separator
        if (priceStr.lastIndexOf(',') > priceStr.lastIndexOf('.')) {
          // European: 1.234,56
          priceStr = priceStr.replace(/\./g, '').replace(',', '.')
        } else {
          // US: 1,234.56
          priceStr = priceStr.replace(/,/g, '')
        }
      } else if (priceStr.includes(',')) {
        // Could be European decimal or US thousands
        const parts = priceStr.split(',')
        if (parts[parts.length - 1].length === 2) {
          // Likely European decimal
          priceStr = priceStr.replace(',', '.')
        } else {
          priceStr = priceStr.replace(/,/g, '')
        }
      }
      const num = parseFloat(priceStr)
      if (!isNaN(num) && num > 0 && num < 100000) return num
    }
  }

  return null
}

function extractCurrency(html: string): string | null {
  // JSON-LD
  const jsonLd = extractJsonLd(html)
  if (jsonLd?.offers) {
    const offers = jsonLd.offers as Record<string, unknown>
    if (offers.priceCurrency) return String(offers.priceCurrency).toUpperCase()
    if (Array.isArray(offers) && offers[0]?.priceCurrency) {
      return String(offers[0].priceCurrency).toUpperCase()
    }
  }

  // Meta tag
  const currencyMeta = extractMetaContent(html, 'product:price:currency')
  if (currencyMeta) return currencyMeta.toUpperCase()

  // Infer from symbols near prices
  if (html.match(/[€]\s*[\d.,]+/) || html.match(/[\d.,]+\s*[€]/)) return 'EUR'
  if (html.match(/[$]\s*[\d.,]+/) || html.match(/[\d.,]+\s*[$]/)) return 'USD'

  return null
}

function extractStoreName(html: string, base: URL): string | null {
  // OG site_name
  const siteName = extractMetaContent(html, 'og:site_name')
  if (siteName) return siteName

  // Application name
  const appName = extractMetaContent(html, 'application-name')
  if (appName) return appName

  // Fall back to domain
  const domain = base.hostname.replace(/^www\./, '')
  const parts = domain.split('.')
  if (parts.length >= 2) {
    // Capitalize first part
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }

  return domain
}

function extractMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+content=["']([^"']+)["']`,
    'i'
  )
  const match = html.match(regex)
  if (match) return match[1].trim()

  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`,
    'i'
  )
  const match2 = html.match(regex2)
  if (match2) return match2[1].trim()

  return null
}
