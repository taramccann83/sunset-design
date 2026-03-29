interface MoodBoardCardProps {
  imageCount: number
  previewImages: string[]
  onClick: () => void
}

export default function MoodBoardCard({ imageCount, previewImages, onClick }: MoodBoardCardProps) {
  const images = previewImages.slice(0, 4)

  return (
    <div
      className="relative cursor-pointer rounded-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
      onClick={onClick}
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

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Image count pill */}
      <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs text-white">
        {imageCount} {imageCount === 1 ? 'image' : 'images'}
      </div>

      {/* Title */}
      <div className="absolute bottom-0 left-0 px-4 pb-3">
        <h3 className="font-serif text-2xl font-semibold text-white">
          Mood Board
        </h3>
        <p className="text-xs text-white/80">
          Pure inspiration
        </p>
      </div>
    </div>
  )
}
