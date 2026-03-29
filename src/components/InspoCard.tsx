import type { InspoImage } from '../types'

interface InspoCardProps {
  image: InspoImage
  onClick: (image: InspoImage) => void
  onDelete: (image: InspoImage) => void
}

export default function InspoCard({ image, onClick, onDelete }: InspoCardProps) {
  return (
    <div
      className="group relative break-inside-avoid mb-4 bg-surface-container-lowest rounded-md cursor-pointer overflow-hidden transition-transform duration-200 hover:scale-[1.02] hover:shadow-card-hover"
      onClick={() => onClick(image)}
    >
      {/* Hover delete button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(image) }}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 text-white/80 hover:bg-status-error hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        aria-label="Delete image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <img
        src={image.image_url}
        alt={image.caption || 'Inspiration'}
        className="w-full block"
        loading="lazy"
      />
      {image.caption && (
        <div className="px-3 py-2">
          <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
            {image.caption}
          </p>
        </div>
      )}
    </div>
  )
}
