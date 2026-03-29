// Offscreen document for stitching screenshot captures into a single image
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'STITCH_IMAGES') {
    stitchImages(msg.captures, msg.width, msg.totalHeight, msg.viewportHeight)
      .then(dataUrl => sendResponse({ dataUrl }))
      .catch(err => sendResponse({ error: err.message }))
    return true
  }
})

async function stitchImages(captures, width, totalHeight, viewportHeight) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')

  for (let i = 0; i < captures.length; i++) {
    const img = await loadImage(captures[i].dataUrl)
    const y = captures[i].y

    // For the last capture, we may need to offset it if the page height
    // isn't a perfect multiple of viewport height
    if (i === captures.length - 1 && totalHeight % viewportHeight !== 0) {
      const remainder = totalHeight % viewportHeight
      const srcY = viewportHeight - remainder
      ctx.drawImage(img, 0, srcY, width, remainder, 0, y, width, remainder)
    } else {
      ctx.drawImage(img, 0, y)
    }
  }

  return canvas.toDataURL('image/png')
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}
