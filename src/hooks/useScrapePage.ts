import { useState } from 'react'
import { supabase } from '../lib/supabase'

export interface ScrapeResult {
  images: string[]
  ogImage: string | null
  productName: string | null
  price: number | null
  currency: string | null
  storeName: string | null
}

export function useScrapePage() {
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function scrape(url: string) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-page', {
        body: { url },
      })

      if (fnError) {
        setError(fnError.message || 'Scrape failed')
        setLoading(false)
        return
      }

      if (data?.error) {
        setError(data.error)
        // Still set partial results if available
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
