import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTags() {
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('pin_tags')
        .select('tag')

      if (data) {
        const unique = [...new Set(data.map((r: { tag: string }) => r.tag))].sort()
        setAllTags(unique)
      }
    }
    fetch()
  }, [])

  return allTags
}
