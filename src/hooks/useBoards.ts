import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Board } from '../types'

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('sort_order')

      if (!error && data) setBoards(data)
      setLoading(false)
    }
    fetch()
  }, [])

  return { boards, loading }
}
