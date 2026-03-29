import { useEffect, useState } from 'react'

export interface ShareTargetData {
  url: string
  title: string
  text: string
  files: File[]
}

export function useShareTarget() {
  const [data, setData] = useState<ShareTargetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function readShareData() {
      const params = new URLSearchParams(window.location.search)

      if (params.get('source') !== 'share-target') {
        setLoading(false)
        return
      }

      try {
        const cache = await caches.open('share-target-cache')
        const response = await cache.match('/share-target-data')

        if (!response) {
          setLoading(false)
          return
        }

        const payload = await response.json()

        // Reconstruct File objects from serialized data
        const files: File[] = []
        if (payload.files && Array.isArray(payload.files)) {
          for (const f of payload.files) {
            const bytes = new Uint8Array(f.data)
            const blob = new Blob([bytes], { type: f.type })
            files.push(new File([blob], f.name, { type: f.type }))
          }
        }

        setData({
          url: payload.url || '',
          title: payload.title || '',
          text: payload.text || '',
          files,
        })

        // Clean up the cache entry
        await cache.delete('/share-target-data')
      } catch (err) {
        console.warn('[Sunset] Share target cache read failed:', err)
      }

      setLoading(false)
    }

    readShareData()
  }, [])

  return { data, loading }
}
