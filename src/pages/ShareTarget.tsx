import { useState, useEffect, useRef, useMemo } from 'react'
import { useShareTarget } from '../hooks/useShareTarget'
import { useScrapePage } from '../hooks/useScrapePage'
import { useBoards } from '../hooks/useBoards'
import { useTags } from '../hooks/useTags'
import { usePinMutations } from '../hooks/usePinMutations'
import type { PinStatus, Currency } from '../types'
import Button from '../components/Button'
import Tag from '../components/Tag'

type ShareMode = 'loading' | 'url' | 'image' | 'manual'

export default function ShareTarget() {
  const { data: shareData, loading: shareLoading } = useShareTarget()
  const { scrape, result: scrapeResult, loading: scraping, error: scrapeError } = useScrapePage()
  const { boards, loading: boardsLoading } = useBoards()
  const allTags = useTags()
  const { createPin, uploadPinImage } = usePinMutations()

  const [mode, setMode] = useState<ShareMode>('loading')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [sharedFile, setSharedFile] = useState<File | null>(null)
  const [showMoreImages, setShowMoreImages] = useState(false)

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
    if (scrapeResult.ogImage) setSelectedImage(scrapeResult.ogImage)
    if (scrapeResult.productName) setProductName(scrapeResult.productName)
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

  const alternativeImages = useMemo(
    () => scrapeResult?.images?.filter((img) => img !== selectedImage) || [],
    [scrapeResult?.images, selectedImage]
  )

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
        setSaveError('Failed to save pin. Please try again.')
        setSaving(false)
        return
      }

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
          <div className="mb-4 p-4 bg-surface-container-lowest rounded-lg text-center">
            <p className="text-sm text-on-surface-variant">
              {scrapeError ? 'Could not reach that page.' : 'No product image found.'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">You can upload one instead.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-primary-dark font-sans font-medium cursor-pointer"
            >
              Upload Image
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
            <div className="rounded-lg overflow-hidden bg-surface-container-lowest">
              <img
                src={selectedImage}
                alt="Product preview"
                className="w-full max-h-64 object-contain"
              />
            </div>

            {alternativeImages.length > 0 && (
              <button
                onClick={() => setShowMoreImages(!showMoreImages)}
                className="mt-2 text-sm text-primary-dark font-sans font-medium cursor-pointer"
              >
                {showMoreImages ? 'Hide images' : `See ${alternativeImages.length} more images`}
              </button>
            )}

            {showMoreImages && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {alternativeImages.map((img) => (
                  <button
                    key={img}
                    onClick={() => {
                      setSelectedImage(img)
                      setSharedFile(null)
                      setShowMoreImages(false)
                    }}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors cursor-pointer ${
                      selectedImage === img ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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
    </div>
  )
}
