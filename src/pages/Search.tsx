import { useState, useMemo } from 'react'
import { usePins } from '../hooks/usePins'
import { useBoards } from '../hooks/useBoards'
import type { Pin, PinStatus } from '../types'
import SearchInput from '../components/SearchInput'
import StatusBadge from '../components/StatusBadge'
import PinCard from '../components/PinCard'
import SkeletonCard from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import PinDetailView from '../components/PinDetailView'

const ALL_STATUSES: PinStatus[] = [
  'wishlist',
  'shortlisted',
  'ordered',
  'arrived',
  'installed',
  'rejected',
]

export default function Search() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PinStatus | undefined>(undefined)
  const [boardFilter, setBoardFilter] = useState('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)

  const { boards } = useBoards()

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter,
      boardId: boardFilter || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [search, statusFilter, boardFilter, minPrice, maxPrice]
  )

  const { pins, loading, refetch } = usePins(filters)

  function handleStatusClick(status: PinStatus) {
    setStatusFilter((prev) => (prev === status ? undefined : status))
  }

  function handlePinClick(pin: Pin) {
    setSelectedPin(pin)
  }

  function handleModalClose() {
    setSelectedPin(null)
    refetch()
  }

  function handlePinUpdate() {
    setSelectedPin(null)
    refetch()
  }

  function handlePinDelete() {
    setSelectedPin(null)
    refetch()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
      {/* Search header */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search pins by name, store, or notes..."
        className="w-full"
      />

      {/* Filter chips row */}
      <div className="flex flex-wrap gap-2 mt-4 mb-8 items-center">
        {/* Status filter pills */}
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusClick(status)}
            className={`cursor-pointer rounded-full transition-all duration-200 ${
              statusFilter === status
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <StatusBadge status={status} />
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/30 mx-1" />

        {/* Board filter */}
        <select
          value={boardFilter}
          onChange={(e) => setBoardFilter(e.target.value)}
          aria-label="Filter by room"
          className="bg-surface-container-high border-0 rounded-md px-3 py-2 text-sm font-sans text-on-surface cursor-pointer"
        >
          <option value="">All rooms</option>
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>

        {/* Divider */}
        <div className="w-px h-6 bg-outline-variant/30 mx-1" />

        {/* Price range inputs */}
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="Min"
          className="bg-surface-container-high border-0 rounded-md px-3 py-2 w-24 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50"
        />
        <span className="text-on-surface-variant text-sm">&ndash;</span>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max"
          className="bg-surface-container-high border-0 rounded-md px-3 py-2 w-24 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50"
        />
      </div>

      {/* Result count */}
      {!loading && pins.length > 0 && (
        <p className="font-sans text-sm text-on-surface-variant mb-4">
          {pins.length} pin{pins.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && pins.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pins.map((pin, i) => (
            <PinCard key={pin.id} pin={pin} onClick={handlePinClick} style={{ animationDelay: `${i * 50}ms` }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && pins.length === 0 && (
        <EmptyState
          type="search"
          message="No pins match your search"
        />
      )}

      {/* Pin Detail Modal */}
      <Modal isOpen={!!selectedPin} onClose={handleModalClose}>
        {selectedPin && (
          <PinDetailView
            pin={selectedPin}
            onClose={handleModalClose}
            onUpdate={handlePinUpdate}
            onDelete={handlePinDelete}
          />
        )}
      </Modal>
    </div>
  )
}
