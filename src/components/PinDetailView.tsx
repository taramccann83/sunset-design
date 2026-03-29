import { useState, useMemo, useRef, useEffect } from 'react'
import type { Pin, PinStatus, Currency } from '../types'
import { useCurrency } from '../contexts/CurrencyContext'
import { usePinMutations } from '../hooks/usePinMutations'
import { useBoards } from '../hooks/useBoards'
import { useTags } from '../hooks/useTags'
import VpnBadge from './VpnBadge'
import Tag from './Tag'

const ALL_STATUSES: PinStatus[] = [
  'wishlist',
  'shortlisted',
  'ordered',
  'arrived',
  'installed',
  'rejected',
]

const statusLabels: Record<PinStatus, string> = {
  wishlist: 'Wishlist',
  shortlisted: 'Shortlisted',
  ordered: 'Ordered',
  arrived: 'Arrived',
  installed: 'Installed',
  rejected: 'Rejected',
}

// --- Tag Editor with autocomplete + browse all ---

interface TagEditorProps {
  tags: string[]
  existingTags: string[]
  newTag: string
  onNewTagChange: (val: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onSelectSuggestion: (tag: string) => void
}

function TagEditor({
  tags,
  existingTags,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag,
  onSelectSuggestion,
}: TagEditorProps) {
  const [showAll, setShowAll] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Autocomplete: filter existing tags by input, exclude already-added
  const suggestions = useMemo(() => {
    const available = existingTags.filter((t) => !tags.includes(t))
    if (!newTag.trim()) return []
    return available.filter((t) => t.includes(newTag.toLowerCase().trim()))
  }, [existingTags, tags, newTag])

  // All tags list: everything not already added
  const allAvailable = useMemo(
    () => existingTags.filter((t) => !tags.includes(t)),
    [existingTags, tags],
  )

  function handleSelect(tag: string) {
    onSelectSuggestion(tag)
    onNewTagChange('')
    setFocused(false)
    setShowAll(false)
  }

  return (
    <div ref={wrapperRef}>
      <div className="flex items-center gap-2 mb-1">
        <label className="font-sans text-xs text-on-surface-variant">Tags</label>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface flex items-center justify-center cursor-pointer transition-colors duration-200"
          title="Browse all tags"
        >
          <span className="text-xs font-semibold leading-none">?</span>
        </button>
      </div>

      {/* Current tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Tag key={tag} label={tag} onRemove={() => onRemoveTag(tag)} />
        ))}
      </div>

      {/* Input + Add button */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => onNewTagChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (suggestions.length > 0) {
                  handleSelect(suggestions[0])
                } else {
                  onAddTag()
                }
              }
            }}
            placeholder="Add tag..."
            className="flex-1 bg-surface-container-high border-0 border-b-2 border-outline-variant/30 focus:border-tertiary focus:outline-none rounded-t-md px-3 py-2 font-sans text-sm text-on-surface transition-colors duration-200"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="font-sans text-sm font-semibold px-3 py-2 rounded-md cursor-pointer bg-transparent border-ghost text-primary-dark hover:bg-surface-container-high"
          >
            Add
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {focused && suggestions.length > 0 && (
          <div className="absolute z-10 left-0 right-12 mt-1 bg-surface-container-lowest rounded-lg shadow-ambient-lg overflow-hidden">
            {suggestions.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(tag)}
                className="w-full text-left px-3 py-2 font-sans text-sm text-on-surface hover:bg-surface-container-high cursor-pointer transition-colors duration-150"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Browse all tags panel */}
      {showAll && allAvailable.length > 0 && (
        <div className="mt-3 p-3 bg-surface-container-high/50 rounded-lg">
          <p className="font-sans text-xs text-on-surface-variant mb-2">All available tags</p>
          <div className="flex flex-wrap gap-2">
            {allAvailable.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelect(tag)}
                className="cursor-pointer"
              >
                <Tag label={tag} />
              </button>
            ))}
          </div>
        </div>
      )}

      {showAll && allAvailable.length === 0 && (
        <div className="mt-3 p-3 bg-surface-container-high/50 rounded-lg">
          <p className="font-sans text-xs text-on-surface-variant">All tags are already added</p>
        </div>
      )}
    </div>
  )
}

// --- Pin Detail View ---

interface PinDetailViewProps {
  pin: Pin
  onClose: () => void
  onUpdate: () => void
  onDelete?: () => void
}

export default function PinDetailView({ pin, onClose: _onClose, onUpdate, onDelete }: PinDetailViewProps) {
  const { updatePin, updatePinTags, deletePin } = usePinMutations()
  const { boards } = useBoards()
  const existingTags = useTags()
  const { formatPinPrice, liveRate } = useCurrency()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<PinStatus>(pin.status)

  // Editable fields
  const [productName, setProductName] = useState(pin.product_name ?? '')
  const [storeName, setStoreName] = useState(pin.store_name ?? '')
  const [priceStr, setPriceStr] = useState(pin.price_eur != null ? String(pin.price_eur) : '')
  const [priceCurrency, setPriceCurrency] = useState<Currency>(pin.price_currency ?? 'EUR')
  const [exchangeRateStr, setExchangeRateStr] = useState(pin.exchange_rate != null ? String(pin.exchange_rate) : '')
  const [notes, setNotes] = useState(pin.notes ?? '')
  const [boardId, setBoardId] = useState(pin.board_id)
  const [tags, setTags] = useState<string[]>(pin.tags ?? [])
  const [newTag, setNewTag] = useState('')
  const [dimW, setDimW] = useState(pin.dimensions?.w != null ? String(pin.dimensions.w) : '')
  const [dimH, setDimH] = useState(pin.dimensions?.h != null ? String(pin.dimensions.h) : '')
  const [dimD, setDimD] = useState(pin.dimensions?.d != null ? String(pin.dimensions.d) : '')
  const [dimUnit, setDimUnit] = useState(pin.dimensions?.unit ?? 'cm')
  const [requiresVpn, setRequiresVpn] = useState(pin.requires_vpn)

  async function handleStatusChange(newStatus: PinStatus) {
    if (newStatus === currentStatus) return
    setCurrentStatus(newStatus)

    const update: Record<string, unknown> = { status: newStatus }

    // Snapshot exchange rate when moving to ordered (if not already set)
    if (newStatus === 'ordered' && !pin.exchange_rate) {
      update.exchange_rate = liveRate
      setExchangeRateStr(String(liveRate))
    }

    await updatePin(pin.id, update)
  }

  async function handleSave() {
    setSaving(true)
    const price = priceStr ? Number(priceStr) : null
    const hasDims = dimW || dimH || dimD
    const dimensions = hasDims
      ? { w: dimW ? Number(dimW) : null, h: dimH ? Number(dimH) : null, d: dimD ? Number(dimD) : null, unit: dimUnit }
      : null

    const success = await updatePin(pin.id, {
      product_name: productName || null,
      store_name: storeName || null,
      price_eur: price,
      price_currency: priceCurrency,
      exchange_rate: exchangeRateStr ? Number(exchangeRateStr) : null,
      notes: notes || null,
      board_id: boardId,
      requires_vpn: requiresVpn,
      dimensions,
    })

    if (success) {
      await updatePinTags(pin.id, tags)
      onUpdate()
    }
    setSaving(false)
  }

  function handleAddTag() {
    const trimmed = newTag.toLowerCase().trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setNewTag('')
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleDelete() {
    const success = await deletePin(pin.id)
    if (success) {
      onDelete?.()
      onUpdate()
    }
  }

  function handleCancelEdit() {
    setProductName(pin.product_name ?? '')
    setStoreName(pin.store_name ?? '')
    setPriceStr(pin.price_eur != null ? String(pin.price_eur) : '')
    setPriceCurrency(pin.price_currency ?? 'EUR')
    setExchangeRateStr(pin.exchange_rate != null ? String(pin.exchange_rate) : '')
    setNotes(pin.notes ?? '')
    setBoardId(pin.board_id)
    setTags(pin.tags ?? [])
    setDimW(pin.dimensions?.w != null ? String(pin.dimensions.w) : '')
    setDimH(pin.dimensions?.h != null ? String(pin.dimensions.h) : '')
    setDimD(pin.dimensions?.d != null ? String(pin.dimensions.d) : '')
    setDimUnit(pin.dimensions?.unit ?? 'cm')
    setRequiresVpn(pin.requires_vpn)
    setEditing(false)
    setConfirmDelete(false)
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function formatDimensions(dims: Pin['dimensions']): string | null {
    if (!dims) return null
    const parts: string[] = []
    if (dims.w != null) parts.push(`${dims.w}`)
    if (dims.h != null) parts.push(`${dims.h}`)
    if (dims.d != null) parts.push(`${dims.d}`)
    if (parts.length === 0) return null
    return `${parts.join(' \u00D7 ')} ${dims.unit}`
  }

  const inputClass = 'w-full bg-surface-container-high border-0 border-b-2 border-outline-variant/30 focus:border-tertiary focus:outline-none rounded-t-md px-3 py-2 font-sans text-sm text-on-surface transition-colors duration-200'

  // --- READ-ONLY VIEW ---
  if (!editing) {
    const dimensionStr = formatDimensions(pin.dimensions)

    return (
      <div>
        <div className="relative">
          <img
            src={pin.image_url}
            alt={pin.product_name ?? 'Pin image'}
            className="w-full rounded-lg"
          />
          {pin.requires_vpn && (
            <div className="absolute top-3 left-3">
              <VpnBadge />
            </div>
          )}
        </div>

        <div className="p-4">
          <h2 className="font-serif text-2xl font-semibold mb-1">
            {pin.product_name ?? 'Untitled'}
          </h2>

          {pin.store_name && (
            <p className="font-sans text-sm text-on-surface-variant mb-4">
              {pin.store_name}
            </p>
          )}

          {pin.price_eur != null && (
            <p className="font-serif text-xl font-semibold text-primary-dark mb-4">
              {formatPinPrice(pin.price_eur, pin.price_currency, pin.exchange_rate)}
            </p>
          )}

          {/* Status quick-change */}
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className={`text-sm font-sans font-semibold px-4 py-2 rounded-full cursor-pointer transition-all duration-200 ${
                  status === currentStatus
                    ? 'gradient-primary text-white shadow-ambient'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-sans text-xs text-on-surface-variant mb-1">Source</p>
              {pin.source_url ? (
                <a
                  href={pin.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans font-semibold text-sm text-primary-dark hover:underline transition-all duration-200"
                >
                  Visit Store
                </a>
              ) : (
                <p className="font-sans text-sm text-on-surface-variant">No source URL</p>
              )}
              {pin.requires_vpn && (
                <p className="text-xs text-status-warning mt-1">
                  This site may require VPN to access
                </p>
              )}
            </div>

            {dimensionStr && (
              <div>
                <p className="font-sans text-xs text-on-surface-variant mb-1">Dimensions</p>
                <p className="font-sans text-sm">{dimensionStr}</p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="font-sans text-xs text-on-surface-variant mb-1">Notes</p>
            <p className="font-sans text-sm text-on-surface-variant">
              {pin.notes || 'No notes'}
            </p>
          </div>

          {pin.tags && pin.tags.length > 0 && (
            <div className="mb-4">
              <p className="font-sans text-xs text-on-surface-variant mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {pin.tags.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </div>
            </div>
          )}

          <p className="font-sans text-xs text-on-surface-variant mb-6">
            Pinned {formatDate(pin.created_at)}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 font-sans font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer transition-all duration-200 gradient-primary text-white"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="font-sans font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer transition-all duration-200 bg-transparent border-ghost text-status-error hover:bg-status-error/5"
            >
              Delete
            </button>
          </div>

          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="mt-4 p-4 bg-status-error/5 rounded-lg">
              <p className="font-sans text-sm text-on-surface mb-3">
                Delete this pin? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="font-sans font-semibold text-sm px-4 py-2 rounded-md cursor-pointer bg-status-error text-white"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="font-sans font-semibold text-sm px-4 py-2 rounded-md cursor-pointer bg-transparent border-ghost text-on-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- EDIT VIEW ---
  return (
    <div>
      <div className="relative">
        <img
          src={pin.image_url}
          alt={productName || 'Pin image'}
          className="w-full rounded-lg"
        />
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="font-sans text-xs text-on-surface-variant mb-1 block">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Product name"
            className={inputClass}
          />
        </div>

        <div>
          <label className="font-sans text-xs text-on-surface-variant mb-1 block">Store</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Store name"
            className={inputClass}
          />
        </div>

        <div>
          <label className="font-sans text-xs text-on-surface-variant mb-1 block">Price</label>
          <div className="flex gap-2">
            <select
              value={priceCurrency}
              onChange={(e) => setPriceCurrency(e.target.value as Currency)}
              className="bg-surface-container-high border-0 rounded-md px-2 py-2 font-sans text-sm text-on-surface cursor-pointer w-20"
            >
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
            </select>
            <input
              type="number"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="0"
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>

        {priceCurrency === 'USD' && (
          <div>
            <label className="font-sans text-xs text-on-surface-variant mb-1 block">
              Exchange Rate (1 EUR = ? USD)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                step="0.01"
                value={exchangeRateStr}
                onChange={(e) => setExchangeRateStr(e.target.value)}
                placeholder={String(liveRate)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setExchangeRateStr(String(liveRate))}
                className="font-sans text-xs text-primary-dark hover:underline cursor-pointer whitespace-nowrap"
              >
                Use live rate ({liveRate.toFixed(4)})
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="font-sans text-xs text-on-surface-variant mb-1 block">Room</label>
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-sans text-xs text-on-surface-variant mb-1 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="font-sans text-xs text-on-surface-variant mb-1 block">Dimensions</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={dimW}
              onChange={(e) => setDimW(e.target.value)}
              placeholder="W"
              className="w-20 bg-surface-container-high border-0 border-b-2 border-outline-variant/30 focus:border-tertiary focus:outline-none rounded-t-md px-3 py-2 font-sans text-sm text-on-surface transition-colors duration-200"
            />
            <span className="text-on-surface-variant text-xs">&times;</span>
            <input
              type="number"
              value={dimH}
              onChange={(e) => setDimH(e.target.value)}
              placeholder="H"
              className="w-20 bg-surface-container-high border-0 border-b-2 border-outline-variant/30 focus:border-tertiary focus:outline-none rounded-t-md px-3 py-2 font-sans text-sm text-on-surface transition-colors duration-200"
            />
            <span className="text-on-surface-variant text-xs">&times;</span>
            <input
              type="number"
              value={dimD}
              onChange={(e) => setDimD(e.target.value)}
              placeholder="D"
              className="w-20 bg-surface-container-high border-0 border-b-2 border-outline-variant/30 focus:border-tertiary focus:outline-none rounded-t-md px-3 py-2 font-sans text-sm text-on-surface transition-colors duration-200"
            />
            <select
              value={dimUnit}
              onChange={(e) => setDimUnit(e.target.value)}
              className="bg-surface-container-high border-0 rounded-md px-2 py-2 font-sans text-sm text-on-surface cursor-pointer"
            >
              <option value="cm">cm</option>
              <option value="mm">mm</option>
              <option value="in">in</option>
              <option value="m">m</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <TagEditor
          tags={tags}
          existingTags={existingTags}
          newTag={newTag}
          onNewTagChange={setNewTag}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onSelectSuggestion={(tag) => {
            if (!tags.includes(tag)) setTags([...tags, tag])
          }}
        />

        {/* VPN toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle VPN required"
            onClick={() => setRequiresVpn(!requiresVpn)}
            className={`relative w-10 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
              requiresVpn ? 'bg-primary-dark' : 'bg-surface-container-high'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                requiresVpn ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="font-sans text-sm text-on-surface-variant">Requires VPN</span>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 font-sans font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer transition-all duration-200 gradient-primary text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="font-sans font-semibold text-sm px-5 py-2.5 rounded-md cursor-pointer transition-all duration-200 bg-transparent border-ghost text-on-surface-variant"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
