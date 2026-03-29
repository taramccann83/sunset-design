import type { Board } from '../types'
import { useCurrency } from '../contexts/CurrencyContext'

interface BoardCardProps {
  board: Board
  pinCount: number
  totalSpent: number
  pinImages?: string[]
  onClick?: (board: Board) => void
}

export default function BoardCard({ board, pinCount, totalSpent, pinImages = [], onClick }: BoardCardProps) {
  const { formatPrice } = useCurrency()
  const formattedBudget = formatPrice(totalSpent)
  const images = pinImages.slice(0, 4)

  return (
    <div
      className="relative cursor-pointer rounded-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
      onClick={() => onClick?.(board)}
    >
      <div className="aspect-[4/3] overflow-hidden">
        {images.length >= 3 ? (
          <div className="grid grid-cols-3 grid-rows-2 gap-0.5 h-full">
            <div className="col-span-2 row-span-2">
              <img src={images[0]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={images[1]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="col-span-1 row-span-1">
              <img src={images[2]} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
            <img src={images[1]} alt="" className="h-full w-full object-cover" />
          </div>
        ) : images.length === 1 ? (
          <img src={images[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-primary opacity-50" />
        )}
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Pin count and budget pill */}
      <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs text-white">
        {pinCount} pins &middot; {formattedBudget}
      </div>

      {/* Board name and area */}
      <div className="absolute bottom-0 left-0 px-4 pb-3">
        <h3 className="font-serif text-2xl font-semibold text-white">
          {board.name}
        </h3>
        {board.area_sqm && (
          <p className="text-xs text-white/80">
            {board.area_sqm} m&sup2;
          </p>
        )}
      </div>
    </div>
  )
}
