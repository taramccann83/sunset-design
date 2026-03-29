import { supabase } from '../lib/supabase'
import type { InspoImage } from '../types'

interface CreateInspoInput {
  image_url: string
  source_url?: string
  caption?: string
}

export function useInspoMutations() {
  async function createInspoImage(input: CreateInspoInput): Promise<InspoImage | null> {
    const { data, error } = await supabase
      .from('inspo_images')
      .insert({
        image_url: input.image_url,
        source_url: input.source_url || null,
        caption: input.caption || null,
      })
      .select()
      .single()

    if (error || !data) return null
    return data as InspoImage
  }

  async function updateInspoImage(
    id: string,
    input: { caption?: string | null; source_url?: string | null },
  ): Promise<boolean> {
    const { error } = await supabase
      .from('inspo_images')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)

    return !error
  }

  async function deleteInspoImage(id: string): Promise<boolean> {
    const { error } = await supabase.from('inspo_images').delete().eq('id', id)
    return !error
  }

  async function uploadInspoImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from('inspo-images')
      .upload(path, file)

    if (error) return null

    const { data } = supabase.storage.from('inspo-images').getPublicUrl(path)
    return data.publicUrl
  }

  return { createInspoImage, updateInspoImage, deleteInspoImage, uploadInspoImage }
}
