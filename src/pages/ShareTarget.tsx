import { useState, useEffect, useRef } from 'react'
import { useShareTarget } from '../hooks/useShareTarget'
import { useScrapePage } from '../hooks/useScrapePage'
import { useBoards } from '../hooks/useBoards'
import { useTags } from '../hooks/useTags'
import { usePinMutations } from '../hooks/usePinMutations'
import type { PinStatus, Currency } from '../types'
import Button from '../components/Button'
import Tag from '../components/Tag'
import ImageEditor from '../components/ImageEditor'
import ImagePicker from '../components/ImagePicker'
import { useToast } from '../components/Toast'

type ShareMode = 'loading' | 'url' | 'image' | 'manual'

export default function ShareTarget() {
  const { toast } = useToast()
  const { data: shareData, loading: shareLoading } = useShareTarget()
  const { scrape, result: scrapeResult, loading: scraping, error: scrapeError } = useScrapePage()
  const { boards, loading: boardsLoading } = useBoards()
  const allTags = useTags()
  const { createPin, uploadPinImage } = usePinMutations()

  const [mode, setMode] = useState<ShareMode>('loading')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [sharedFile, setSharedFile] = useState<File | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  // Form state
  const [boardId, setBoardId] = useState('')
  const [status, setStatus] = useState<PinStatus>('wishlist')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [newTagInput, setNewTagInput] = useState('')
  const [productName, setProductName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [notes, setNotes] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  // Image editor state
  const [showEditor, setShowEditor] = useState(false)
  const [editorSrc, setEditorSrc] = useState<string | null>(null)

  // Save state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Manual mode state
  const [manualUrl, setManualUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Set default board when boards load
  useEffect(() => {
    if (boards.length > 0 && !boardId) {
      setBoardId(boards[0].id)
    }
  }, [boards, boardId])

  // Determine mode from share data
  useEffect(() => {
    if (shareLoading) return

    if (!shareData) {
      setMode('manual')
      return
    }

    if (shareData.files.length > 0) {
      setMode('image')
      const file = shareData.files[0]
      setSharedFile(file)
      setSelectedImage(URL.createObjectURL(file))
    } else if (shareData.url) {
      setMode('url')
      setSourceUrl(shareData.url)
      scrape(shareData.url)
    } else if (shareData.text) {
      const urlMatch = shareData.text.match(/https?:\/\/[^\s]+/)
      if (urlMatch) {
        setMode('url')
        setSourceUrl(urlMatch[0])
        scrape(urlMatch[0])
      } else {
        setMode('manual')
        setNotes(shareData.text)
      }
    } else {
      setMode('manual')
    }
  }, [shareData, shareLoading])

  // Pre-fill form from scrape results
  useEffect(() => {
    if (!scrapeResult) return
    // Picker-first: if multiple images, open picker instead of auto-selecting.
    // If only one image, auto-select it. If zero, leave the existing fallback UI.
    if (scrapeResult.images.length >= 2) {
      setShowPicker(true)
    } else if (scrapeResult.images.length === 1) {
      setSelectedImage(scrapeResult.images[0])
    } else if (scrapeResult.ogImage) {
      setSelectedImage(scrapeResult.ogImage)
    }
    // Filter out junk product names from blocked pages
    const junkNames = ['service unavailable', 'access denied', 'just a moment', 'attention required', 'error', '403 forbidden', '404']
    if (scrapeResult.productName && !junkNames.some((j) => scrapeResult.productName!.toLowerCase().includes(j))) {
      setProductName(scrapeResult.productName)
    }
    if (scrapeResult.storeName) setStoreName(scrapeResult.storeName)
    if (scrapeResult.price) setPrice(String(scrapeResult.price))
    if (scrapeResult.currency === 'EUR' || scrapeResult.currency === 'USD') {
      setCurrency(scrapeResult.currency)
    }
  }, [scrapeResult])

  // Scroll to top when mode or image changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [mode, selectedImage])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }

  function handleNewTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const tag = newTagInput.trim().toLowerCase()
      if (tag) {
        setSelectedTags((prev) => new Set(prev).add(tag))
        setNewTagInput('')
        ;(e.target as HTMLInputElement).blur()
      }
    }
  }

  function handleManualUrl() {
    if (!manualUrl.trim()) return
    setMode('url')
    setSourceUrl(manualUrl.trim())
    scrape(manualUrl.trim())
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMode('image')
    setSharedFile(file)
    setSelectedImage(URL.createObjectURL(file))
  }

  function openEditor() {
    if (selectedImage) {
      setEditorSrc(selectedImage)
      setShowEditor(true)
    }
  }

  function handleEditorDone(blob: Blob) {
    const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setSharedFile(file)
    setSelectedImage(URL.createObjectURL(file))
    setShowEditor(false)
    setEditorSrc(null)
  }

  function handleEditorCancel() {
    setShowEditor(false)
    setEditorSrc(null)
  }

  function handlePickerSelect(imageUrl: string) {
    setSelectedImage(imageUrl)
    setSharedFile(null)
    setShowPicker(false)
  }

  function handlePickerUpload(file: File) {
    setSharedFile(file)
    setSelectedImage(URL.createObjectURL(file))
    setShowPicker(false)
  }

  async function handleSave() {
    if (!selectedImage && !sharedFile) return
    if (!boardId) return

    setSaving(true)
    setSaveError(null)

    try {
      let imageUrl: string | null = null

      if (sharedFile) {
        imageUrl = await uploadPinImage(sharedFile)
      } else if (selectedImage) {
        try {
          const res = await fetch(selectedImage)
          if (!res.ok) throw new Error('Image fetch failed')
          const blob = await res.blob()
          const ext = blob.type.split('/')[1] || 'jpg'
          const file = new File([blob], `share-${Date.now()}.${ext}`, { type: blob.type })
          imageUrl = await uploadPinImage(file)
        } catch {
          toast('Could not download the image. Try uploading from camera roll.', 'error')
          setSaveError('Could not download the image. Try saving it to your camera roll and sharing the file instead.')
          setSaving(false)
          return
        }
      }

      if (!imageUrl) {
        setSaveError('Image upload failed. Please try again.')
        setSaving(false)
        return
      }

      const pin = await createPin({
        board_id: boardId,
        image_url: imageUrl,
        source_url: sourceUrl || undefined,
        store_name: storeName || undefined,
        product_name: productName || undefined,
        price_eur: price ? parseFloat(price) : undefined,
        price_currency: currency,
        notes: notes || undefined,
        status,
        tags: selectedTags.size > 0 ? Array.from(selectedTags) : undefined,
      })

      if (!pin) {
        toast('Failed to save pin', 'error')
        setSaveError('Failed to save pin. Please try again.')
        setSaving(false)
        return
      }

      toast('Pin saved!', 'success')
      setSaved(true)

      setTimeout(() => {
        window.location.href = '/'
      }, 1200)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  function handleClose() {
    window.location.href = '/'
  }

  // Loading state
  if (mode === 'loading' || boardsLoading) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-sans">Loading...</p>
        </div>
      </div>
    )
  }

  // No boards available
  if (boards.length === 0) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-serif text-on-surface">No rooms available</p>
          <p className="text-sm text-on-surface-variant mt-2">
            Create a room in the app first, then come back to pin.
          </p>
          <Button onClick={handleClose} className="mt-4">
            Open App
          </Button>
        </div>
      </div>
    )
  }

  // Success state
  if (saved) {
    return (
      <div className="min-h-dvh bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-serif text-on-surface">Pinned!</p>
        </div>
      </div>
    )
  }

  const hasImage = selectedImage || sharedFile
  const showForm = mode !== 'manual' || selectedImage

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-secondary text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-serif text-lg">Save to Sunset Design</h1>
        <button
          onClick={handleClose}
          aria-label="Close"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {/* Manual mode: URL input + file upload */}
        {mode === 'manual' && (
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Product URL"
                className="flex-1 bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors rounded-t-md"
                onKeyDown={(e) => e.key === 'Enter' && handleManualUrl()}
              />
              <Button onClick={handleManualUrl} disabled={!manualUrl.trim()} className="min-h-[44px]">
                Fetch
              </Button>
            </div>
            <div className="text-center text-sm text-on-surface-variant">or</div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[56px] border-2 border-dashed border-outline-variant/30 rounded-lg py-8 text-sm text-on-surface-variant font-sans hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
            >
              Tap to upload an image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Scraping loading state */}
        {scraping && (
          <div className="mb-6 aspect-[4/3] bg-surface-container-lowest rounded-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-on-surface-variant font-sans">Fetching product details...</p>
            </div>
          </div>
        )}

        {/* No image found after scrape */}
        {!scraping && !selectedImage && sourceUrl && mode === 'url' && (
          <div className="mb-4 p-6 bg-surface-container-lowest rounded-lg text-center">
            <svg className="w-10 h-10 mx-auto text-on-surface-variant/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm font-sans font-medium text-on-surface">
              {scrapeError ? "This site blocked the image fetch" : "No product image found"}
            </p>
            <p className="text-xs text-on-surface-variant mt-1 mb-4">
              Save the image from the product page, then upload it here
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full gradient-primary text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer transition-opacity hover:opacity-90"
            >
              Upload from Camera Roll
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Image preview */}
        {selectedImage && !scraping && (
          <div className="mb-4">
            <div className="relative rounded-lg overflow-hidden bg-surface-container-lowest group">
              <img
                src={selectedImage}
                alt="Product preview"
                className="w-full max-h-64 object-contain"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/80 backdrop-blur-sm text-white text-xs font-sans font-medium cursor-pointer transition-all hover:bg-secondary/90 min-h-[44px]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Replace
                </button>
                <button
                  onClick={openEditor}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/80 backdrop-blur-sm text-white text-xs font-sans font-medium cursor-pointer transition-all hover:bg-secondary/90 min-h-[44px]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h-1a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" />
                    <path d="M20.385 6.585a2.1 2.1 0 0 0-2.97-2.97L9 12v3h3l8.385-8.415z" />
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="space-y-4">
            {/* Room */}
            <div>
              <label htmlFor="shareRoom" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Room</label>
              <select
                id="shareRoom"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface outline-none transition-colors rounded-t-md cursor-pointer"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="shareStatus" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Status</label>
              <select
                id="shareStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as PinStatus)}
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface outline-none transition-colors rounded-t-md cursor-pointer"
              >
                <option value="wishlist">Wishlist</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="ordered">Ordered</option>
                <option value="arrived">Arrived</option>
                <option value="installed">Installed</option>
              </select>
            </div>

            {/* Product name */}
            <div>
              <label htmlFor="shareProduct" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Product name</label>
              <input
                id="shareProduct"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Product name"
                maxLength={150}
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors rounded-t-md"
              />
            </div>

            {/* Store */}
            <div>
              <label htmlFor="shareStore" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Store</label>
              <input
                id="shareStore"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store name"
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors rounded-t-md"
              />
            </div>

            {/* Price + Currency */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="sharePrice" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Price</label>
                <input
                  id="sharePrice"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors rounded-t-md"
                />
              </div>
              <div className="w-20">
                <label htmlFor="shareCurrency" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Currency</label>
                <select
                  id="shareCurrency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface outline-none transition-colors rounded-t-md cursor-pointer"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="shareTagInput" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Tags</label>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="cursor-pointer"
                    >
                      <Tag label={tag} active={selectedTags.has(tag)} />
                    </button>
                  ))}
                </div>
              )}
              {Array.from(selectedTags)
                .filter((t) => !allTags.includes(t))
                .map((tag) => (
                  <span key={tag} className="inline-block mr-1.5 mb-1.5">
                    <Tag
                      label={tag}
                      active
                      onRemove={() => {
                        setSelectedTags((prev) => {
                          const next = new Set(prev)
                          next.delete(tag)
                          return next
                        })
                      }}
                    />
                  </span>
                ))}
              <input
                id="shareTagInput"
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleNewTag}
                placeholder="Add new tag and press Enter"
                maxLength={30}
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors rounded-t-md"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="shareNotes" className="block text-xs font-sans font-medium text-on-surface-variant mb-1">Notes</label>
              <textarea
                id="shareNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                rows={3}
                className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-tertiary px-3 py-2.5 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 outline-none transition-colors rounded-t-md resize-none"
              />
            </div>

            {/* Error */}
            {saveError && (
              <p className="text-sm text-primary-dark font-sans">{saveError}</p>
            )}
          </div>
        )}
      </div>

      {/* Fixed save button at bottom */}
      {showForm && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-outline-variant/10 px-4 py-3">
          <Button
            onClick={handleSave}
            disabled={saving || !hasImage || !boardId}
            className="w-full text-center"
          >
            {saving ? 'Saving...' : 'Save Pin'}
          </Button>
        </div>
      )}

      {/* Image editor — rendered outside scroll container via portal */}
      {showEditor && editorSrc && (
        <ImageEditor
          imageSrc={editorSrc}
          onDone={handleEditorDone}
          onCancel={handleEditorCancel}
        />
      )}

      {/* Image picker — rendered outside scroll container via portal */}
      {showPicker && (
        <ImagePicker
          images={scrapeResult?.images || []}
          selectedImage={selectedImage}
          onSelect={handlePickerSelect}
          onUpload={handlePickerUpload}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
