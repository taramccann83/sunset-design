import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Board } from '../types'

export function useBoard(slug: string | undefined) {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }

    async function fetch() {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!error && data) setBoard(data)
      setLoading(false)
    }
    fetch()
  }, [slug])

  return { board, loading }
}
