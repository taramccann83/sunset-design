const CACHE_NAME = 'sunset-design-v1'
const SHARE_CACHE = 'share-target-cache'

// Static assets to precache (app shell)
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/hero.png',
]

// Install: precache app shell, then skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== SHARE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Share Target: intercept POST to /share
  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(handleShareTarget(event.request))
    return
  }

  // For navigation requests, serve app shell (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    )
    return
  }

  // For other requests: network first, fall back to cache
  event.respondWith(
    fetch(event.request).then((response) => {
      // Cache successful GET responses for static assets
      if (event.request.method === 'GET' && response.ok) {
        const responseClone = response.clone()
        const reqUrl = event.request.url
        if (
          reqUrl.includes('/assets/') ||
          reqUrl.endsWith('.png') ||
          reqUrl.endsWith('.jpg') ||
          reqUrl.endsWith('.svg') ||
          reqUrl.endsWith('.woff2')
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
      }
      return response
    }).catch(() => caches.match(event.request))
  )
})

// Handle Share Target POST
async function handleShareTarget(request) {
  const formData = await request.formData()

  // Extract shared data
  const shareData = {
    title: formData.get('title') || '',
    text: formData.get('text') || '',
    url: formData.get('url') || '',
  }

  // Extract shared files
  const files = formData.getAll('images')
  const fileData = []
  for (const file of files) {
    if (file instanceof File && file.size > 0) {
      const buffer = await file.arrayBuffer()
      fileData.push({
        name: file.name,
        type: file.type,
        data: Array.from(new Uint8Array(buffer)),
      })
    }
  }

  // Try to extract URL from text field if url field is empty
  // (some apps put the URL in the text field)
  if (!shareData.url && shareData.text) {
    const urlMatch = shareData.text.match(/https?:\/\/[^\s]+/)
    if (urlMatch) {
      shareData.url = urlMatch[0]
    }
  }

  // Store in cache for the page to pick up
  const cache = await caches.open(SHARE_CACHE)
  const payload = JSON.stringify({ ...shareData, files: fileData })
  await cache.put(
    new Request('/share-target-data'),
    new Response(payload, {
      headers: { 'Content-Type': 'application/json' },
    })
  )

  // Redirect to the share page
  return Response.redirect('/share?source=share-target', 303)
}
