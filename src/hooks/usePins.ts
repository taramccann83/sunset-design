import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Pin, PinStatus } from '../types'

interface PinFilters {
  boardId?: string
  status?: PinStatus
  tag?: string
  search?: string
  storeFilter?: string
  minPrice?: number
  maxPrice?: number
}

export function usePins(filters: PinFilters = {}) {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPins = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('pins')
      .select('*, pin_tags(tag)')
      .order('created_at', { ascending: false })

    if (filters.boardId) {
      query = query.eq('board_id', filters.boardId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.storeFilter) {
      query = query.ilike('store_name', `%${filters.storeFilter}%`)
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price_eur', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price_eur', filters.maxPrice)
    }
    if (filters.search) {
      query = query.or(
        `product_name.ilike.%${filters.search}%,store_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
      )
    }

    const { data, error } = await query

    if (!error && data) {
      const mapped = data.map((pin: Record<string, unknown>) => ({
        ...pin,
        tags: ((pin.pin_tags as { tag: string }[]) || []).map((t) => t.tag),
        pin_tags: undefined,
      })) as unknown as Pin[]

      if (filters.tag) {
        setPins(mapped.filter((p) => p.tags?.includes(filters.tag!)))
      } else {
        setPins(mapped)
      }
    }

    setLoading(false)
  }, [filters.boardId, filters.status, filters.tag, filters.search, filters.storeFilter, filters.minPrice, filters.maxPrice])

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  return { pins, loading, refetch: fetchPins }
}

export function usePin(id: string | undefined) {
  const [pin, setPin] = useState<Pin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }

    async function fetch() {
      const { data, error } = await supabase
        .from('pins')
        .select('*, pin_tags(tag)')
        .eq('id', id)
        .single()

      if (!error && data) {
        setPin({
          ...data,
          tags: (data.pin_tags || []).map((t: { tag: string }) => t.tag),
          pin_tags: undefined,
        } as Pin)
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  return { pin, setPin, loading }
}
