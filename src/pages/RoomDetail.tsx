import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useBoard } from '../hooks/useBoard'
import { usePins } from '../hooks/usePins'
import { useCurrency } from '../contexts/CurrencyContext'
import { pinPriceInEur } from '../lib/format'
import BudgetBar from '../components/BudgetBar'
import PinCard from '../components/PinCard'
import Tag from '../components/Tag'
import Modal from '../components/Modal'
import PinDetailView from '../components/PinDetailView'
import type { Pin } from '../types'

export default function RoomDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { board, loading: boardLoading } = useBoard(slug)
  const { pins, loading: pinsLoading, refetch } = usePins({ boardId: board?.id })
  const { liveRate } = useCurrency()
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    pins.forEach((pin) => {
      pin.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [pins])

  const filteredPins = useMemo(() => {
    if (!selectedTag) return pins
    return pins.filter((p) => p.tags?.includes(selectedTag))
  }, [pins, selectedTag])

  const totalSpent = useMemo(() => {
    return pins
      .filter((p) => ['ordered', 'arrived', 'installed'].includes(p.status))
      .reduce((sum, p) => sum + pinPriceInEur(p.price_eur, p.price_currency, p.exchange_rate, liveRate), 0)
  }, [pins, liveRate])

  if (boardLoading || pinsLoading) {
    return (
      <p className="font-sans text-on-surface-variant">Loading...</p>
    )
  }

  if (!board) {
    return (
      <p className="font-sans text-on-surface-variant">Room not found.</p>
    )
  }

  function buildSubtitle() {
    const parts: string[] = []
    if (board!.area_sqm) parts.push(`${board!.area_sqm} m\u00B2`)
    if (board!.orientation) parts.push(board!.orientation)
    return parts.join(' \u2014 ')
  }

  function handleTagClick(tag: string) {
    setSelectedTag((prev) => (prev === tag ? null : tag))
  }

  function handlePinClick(pin: Pin) {
    setSelectedPin(pin)
  }

  const subtitle = buildSubtitle()

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
      <Link
        to="/rooms"
        className="text-sm font-sans text-on-surface-variant hover:text-primary-dark mb-4 inline-block"
      >
        &larr; Rooms
      </Link>

      <h1 className="font-serif text-3xl lg:text-5xl font-semibold text-primary-dark">
        {board.name}
      </h1>

      {subtitle && (
        <p className="font-sans text-on-surface-variant mt-1">
          {subtitle}
        </p>
      )}

      {board.budget_eur !== null && (
        <div className="mt-4 max-w-md">
          <BudgetBar
            label="Room budget"
            budget={board.budget_eur}
            spent={totalSpent}
          />
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="cursor-pointer"
              onClick={() => handleTagClick(tag)}
            >
              <Tag label={tag} active={selectedTag === tag} />
            </button>
          ))}
        </div>
      )}

      {filteredPins.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <p className="font-serif text-xl text-on-surface-variant">
            No pins yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filteredPins.map((pin) => (
            <PinCard key={pin.id} pin={pin} onClick={handlePinClick} />
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedPin} onClose={() => { setSelectedPin(null); refetch() }}>
        {selectedPin && (
          <PinDetailView
            pin={selectedPin}
            onClose={() => { setSelectedPin(null); refetch() }}
            onUpdate={() => { setSelectedPin(null); refetch() }}
            onDelete={() => { setSelectedPin(null); refetch() }}
          />
        )}
      </Modal>
    </div>
  )
}
