import { useState } from 'react'

export interface ScrapeResult {
  images: string[]
  ogImage: string | null
  productName: string | null
  price: number | null
  currency: string | null
  storeName: string | null
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function useScrapePage() {
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function scrape(url: string) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scrape-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      })

      if (!res.ok) {
        setError(`Scrape failed (${res.status})`)
        setLoading(false)
        return
      }

      const data = await res.json()

      if (data?.error) {
        setError(data.error)
        if (data.images || data.ogImage) {
          setResult(data as ScrapeResult)
        }
        setLoading(false)
        return
      }

      setResult(data as ScrapeResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }

    setLoading(false)
  }

  return { scrape, result, loading, error }
}
