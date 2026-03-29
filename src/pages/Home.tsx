import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { usePins } from '../hooks/usePins'
import { useCurrency } from '../contexts/CurrencyContext'
import { pinPriceInEur } from '../lib/format'
import PinCard from '../components/PinCard'
import BoardCard from '../components/BoardCard'
import SkeletonCard from '../components/SkeletonCard'
import Modal from '../components/Modal'
import PinDetailView from '../components/PinDetailView'
import type { Pin } from '../types'

const COMMITTED_STATUSES = new Set(['ordered', 'arrived', 'installed'])

export default function Home() {
  const navigate = useNavigate()
  const { boards, loading: boardsLoading } = useBoards()
  const { pins, loading: pinsLoading, refetch } = usePins()
  const { liveRate } = useCurrency()
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)

  const loading = boardsLoading || pinsLoading

  const recentPins = useMemo(() => pins.slice(0, 8), [pins])

  const featuredBoards = useMemo(() => boards.slice(0, 4), [boards])

  const boardStats = useMemo(() => {
    const map = new Map<string, { pinCount: number; totalSpent: number; images: string[] }>()
    for (const pin of pins) {
      const entry = map.get(pin.board_id) || { pinCount: 0, totalSpent: 0, images: [] }
      entry.pinCount += 1
      if (COMMITTED_STATUSES.has(pin.status)) {
        entry.totalSpent += pinPriceInEur(pin.price_eur, pin.price_currency, pin.exchange_rate, liveRate)
      }
      if (entry.images.length < 4) {
        entry.images.push(pin.image_url)
      }
      map.set(pin.board_id, entry)
    }
    return map
  }, [pins, liveRate])

  function handlePinClick(pin: Pin) {
    setSelectedPin(pin)
  }

  if (loading) {
    return (
      <div>
        <div className="w-full h-[50vh] bg-surface-container-high animate-skeleton" />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-12">
          <div className="h-6 w-40 bg-surface-container-high animate-skeleton rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero — full bleed, scrolls with page */}
      <div className="relative mb-12">
        <img
          src="/hero.png"
          alt="Sunset over Ericeira"
          className="w-full h-[50vh] object-cover object-bottom"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1
            className="font-serif text-4xl lg:text-6xl font-bold text-white"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.4), 0 8px 48px rgba(0,0,0,0.3)' }}
          >
            Sunset Condo Design
          </h1>
        </div>
      </div>

    <div className="max-w-6xl mx-auto px-4 lg:px-8">

      {/* Recent Pins */}
      {recentPins.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-semibold mb-6">Recent Pins</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentPins.map((pin, i) => (
              <PinCard key={pin.id} pin={pin} onClick={handlePinClick} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Rooms */}
      {featuredBoards.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-semibold mb-6">Your Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {featuredBoards.map((board, i) => {
              const stats = boardStats.get(board.id) || { pinCount: 0, totalSpent: 0, images: [] }
              return (
                <BoardCard
                  key={board.id}
                  board={board}
                  pinCount={stats.pinCount}
                  totalSpent={stats.totalSpent}
                  pinImages={stats.images}
                  onClick={() => navigate(`/rooms/${board.slug}`)}
                  style={{ animationDelay: `${i * 75}ms` }}
                />
              )
            })}
          </div>
        </section>
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
    </div>
  )
}
