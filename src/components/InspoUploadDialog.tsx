import { useState, useRef, type DragEvent } from 'react'
import Modal from './Modal'
import { useInspoMutations } from '../hooks/useInspoMutations'
import { supabase } from '../lib/supabase'

interface InspoUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

type Mode = 'browse' | 'upload'

export default function InspoUploadDialog({ isOpen, onClose, onAdded }: InspoUploadDialogProps) {
  const [mode, setMode] = useState<Mode>('browse')

  // Browse URL state
  const [urlInput, setUrlInput] = useState('')
  const [scrapedImages, setScrapedImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)

  const { createInspoImage, uploadInspoImage } = useInspoMutations()

  function reset() {
    setUrlInput('')
    setScrapedImages([])
    setSelectedImages(new Set())
    setScraping(false)
    setScrapeError('')
    setSourceUrl('')
    setFile(null)
    setPreview(null)
    setDragging(false)
    setSaving(false)
    setMode('browse')
  }

  function handleClose() {
    reset()
    onClose()
  }

  // --- Browse URL ---

  async function handleScrape() {
    if (!urlInput.trim()) return
    setScraping(true)
    setScrapeError('')
    setScrapedImages([])
    setSelectedImages(new Set())

    try {
      const { data: { publicUrl } } = supabase.storage.from('inspo-images').getPublicUrl('_')
      const baseUrl = publicUrl.replace('/storage/v1/object/public/inspo-images/_', '')

      const res = await fetch(`${baseUrl}/functions/v1/scrape-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      })

      const json = await res.json()

      if (json.error) {
        setScrapeError(json.error)
      } else if (json.images && json.images.length > 0) {
        setScrapedImages(json.images)
        setSourceUrl(urlInput.trim())
      } else {
        setScrapeError('No images found on that page')
      }
    } catch {
      setScrapeError('Failed to fetch images. Check the URL and try again.')
    }

    setScraping(false)
  }

  function toggleImage(src: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev)
      if (next.has(src)) {
        next.delete(src)
      } else {
        next.add(src)
      }
      return next
    })
  }

  function selectAll() {
    if (selectedImages.size === scrapedImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(scrapedImages))
    }
  }

  async function handleAddSelected() {
    setSaving(true)
    const promises = Array.from(selectedImages).map((imageUrl) =>
      createInspoImage({
        image_url: imageUrl,
        source_url: sourceUrl || undefined,
      })
    )
    await Promise.all(promises)
    reset()
    onAdded()
  }

  // --- Upload ---

  function handleFileSelect(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFileSelect(f)
  }

  async function handleUploadSubmit() {
    if (!file) return
    setSaving(true)
    const imageUrl = await uploadInspoImage(file)
    if (imageUrl) {
      await createInspoImage({ image_url: imageUrl })
    }
    reset()
    onAdded()
  }

  const inputClass =
    'w-full bg-surface-container-high border-0 rounded-md px-3 py-2 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Inspiration">
      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('browse')}
          className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-colors cursor-pointer ${
            mode === 'browse'
              ? 'gradient-primary text-white'
              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Browse URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-colors cursor-pointer ${
            mode === 'upload'
              ? 'gradient-primary text-white'
              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Browse URL mode */}
      {mode === 'browse' && (
        <>
          {/* URL input + fetch button */}
          <div className="flex gap-2 mb-4">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleScrape() }}
              placeholder="Paste a webpage URL..."
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              disabled={scraping || !urlInput.trim()}
              onClick={handleScrape}
              className="gradient-primary text-white font-sans font-medium text-sm px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {scraping ? 'Scanning...' : 'Find Images'}
            </button>
          </div>

          {/* Error */}
          {scrapeError && (
            <p className="font-sans text-sm text-status-error mb-4">{scrapeError}</p>
          )}

          {/* Scraped images grid */}
          {scrapedImages.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="font-sans text-sm text-on-surface-variant">
                  {scrapedImages.length} images found &middot; {selectedImages.size} selected
                </p>
                <button
                  type="button"
                  onClick={selectAll}
                  className="font-sans text-xs text-primary hover:underline cursor-pointer"
                >
                  {selectedImages.size === scrapedImages.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto mb-6 pr-1">
                {scrapedImages.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => toggleImage(src)}
                    className={`relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all ${
                      selectedImages.has(src)
                        ? 'ring-3 ring-primary ring-offset-2 ring-offset-surface'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                    />
                    {selectedImages.has(src) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={saving || selectedImages.size === 0}
                onClick={handleAddSelected}
                className="w-full gradient-primary text-white font-sans font-medium text-sm py-3 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {saving
                  ? `Adding ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''}...`
                  : `Add ${selectedImages.size} image${selectedImages.size !== 1 ? 's' : ''} to Mood Board`}
              </button>
            </>
          )}
        </>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <>
          <div className="mb-6">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-md max-h-[300px] object-contain bg-surface-container-high"
                />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-black/70"
                >
                  x
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant/40 hover:border-primary/50'
                }`}
              >
                <p className="font-sans text-sm text-on-surface-variant">
                  Drop an image here or click to browse
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={saving || !file}
            onClick={handleUploadSubmit}
            className="w-full gradient-primary text-white font-sans font-medium text-sm py-3 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {saving ? 'Uploading...' : 'Add to Mood Board'}
          </button>
        </>
      )}
    </Modal>
  )
}
