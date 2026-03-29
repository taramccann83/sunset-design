import { supabase } from '../lib/supabase'
import type { Pin, PinStatus, Currency } from '../types'

interface CreatePinInput {
  board_id: string
  image_url: string
  source_url?: string
  store_name?: string
  product_name?: string
  price_eur?: number
  price_currency?: Currency
  notes?: string
  status?: PinStatus
  tags?: string[]
  requires_vpn?: boolean
}

interface UpdatePinInput {
  product_name?: string | null
  store_name?: string | null
  price_eur?: number | null
  price_currency?: Currency
  exchange_rate?: number | null
  notes?: string | null
  status?: PinStatus
  board_id?: string
  requires_vpn?: boolean
  dimensions?: { w: number | null; h: number | null; d: number | null; unit: string } | null
}

export function usePinMutations() {
  async function createPin(input: CreatePinInput): Promise<Pin | null> {
    const { tags, ...pinData } = input
    const { data, error } = await supabase
      .from('pins')
      .insert({
        ...pinData,
        source_url: pinData.source_url || '',
        status: pinData.status || 'wishlist',
      })
      .select()
      .single()

    if (error || !data) return null

    if (tags && tags.length > 0) {
      await supabase.from('pin_tags').insert(
        tags.map((tag) => ({ pin_id: data.id, tag: tag.toLowerCase().trim() }))
      )
    }

    return { ...data, tags } as Pin
  }

  async function updatePin(id: string, input: UpdatePinInput): Promise<boolean> {
    const { error } = await supabase
      .from('pins')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)

    return !error
  }

  async function updatePinTags(pinId: string, tags: string[]): Promise<boolean> {
    await supabase.from('pin_tags').delete().eq('pin_id', pinId)

    if (tags.length > 0) {
      const { error } = await supabase.from('pin_tags').insert(
        tags.map((tag) => ({ pin_id: pinId, tag: tag.toLowerCase().trim() }))
      )
      return !error
    }
    return true
  }

  async function deletePin(id: string): Promise<boolean> {
    const { error } = await supabase.from('pins').delete().eq('id', id)
    return !error
  }

  async function uploadPinImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from('pin-images')
      .upload(path, file)

    if (error) return null

    const { data } = supabase.storage.from('pin-images').getPublicUrl(path)
    return data.publicUrl
  }

  return { createPin, updatePin, updatePinTags, deletePin, uploadPinImage }
}
