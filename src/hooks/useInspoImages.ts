import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { InspoImage } from '../types'

export function useInspoImages() {
  const [images, setImages] = useState<InspoImage[]>([])
  const [loading, setLoading] = useState(true)

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from('inspo_images')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setImages(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  return { images, loading, refetch: fetchImages }
}
