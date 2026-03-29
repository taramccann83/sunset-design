import { useNavigate } from 'react-router-dom'
import { useBoards } from '../hooks/useBoards'
import { usePins } from '../hooks/usePins'
import { useInspoImages } from '../hooks/useInspoImages'
import { useCurrency } from '../contexts/CurrencyContext'
import { pinPriceInEur } from '../lib/format'
import BoardCard from '../components/BoardCard'
import MoodBoardCard from '../components/MoodBoardCard'
import SkeletonCard from '../components/SkeletonCard'
import type { Board } from '../types'

export default function Rooms() {
  const { boards, loading: boardsLoading } = useBoards()
  const { pins, loading: pinsLoading } = usePins()
  const { images: inspoImages, loading: inspoLoading } = useInspoImages()
  const { liveRate } = useCurrency()
  const navigate = useNavigate()

  if (boardsLoading || pinsLoading || inspoLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
        <div className="h-8 w-32 bg-surface-container-high animate-skeleton rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} type="board" />
          ))}
        </div>
      </div>
    )
  }

  function getBoardStats(board: Board) {
    const boardPins = pins.filter((p) => p.board_id === board.id)
    const pinCount = boardPins.length
    const totalSpent = boardPins
      .filter((p) => ['ordered', 'arrived', 'installed'].includes(p.status))
      .reduce((sum, p) => sum + pinPriceInEur(p.price_eur, p.price_currency, p.exchange_rate, liveRate), 0)
    const pinImages = boardPins.slice(0, 4).map((p) => p.image_url)
    return { pinCount, totalSpent, pinImages }
  }

  function handleBoardClick(board: Board) {
    navigate(`/rooms/${board.slug}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
      <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-primary-dark mb-2">
        Rooms
      </h1>

      <div className="h-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board, i) => {
          const { pinCount, totalSpent, pinImages } = getBoardStats(board)

          return (
            <BoardCard
              key={board.id}
              board={board}
              pinCount={pinCount}
              totalSpent={totalSpent}
              pinImages={pinImages}
              onClick={handleBoardClick}
              style={{ animationDelay: `${i * 50}ms` }}
            />
          )
        })}
        <MoodBoardCard
          imageCount={inspoImages.length}
          previewImages={inspoImages.slice(0, 4).map((img) => img.image_url)}
          onClick={() => navigate('/mood-board')}
        />
      </div>
    </div>
  )
}
