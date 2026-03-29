import { useEffect } from 'react'
import type { InspoImage } from '../types'

interface InspoLightboxProps {
  images: InspoImage[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  onDelete: (image: InspoImage) => void
}

export default function InspoLightbox({ images, currentIndex, onClose, onNavigate, onDelete }: InspoLightboxProps) {
  const image = images[currentIndex]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [currentIndex, images.length, onClose, onNavigate])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Delete button */}
      <button
        className="absolute top-4 right-14 text-white/50 hover:text-status-error transition-colors cursor-pointer z-10"
        onClick={(e) => { e.stopPropagation(); onDelete(image) }}
        aria-label="Delete image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Nav arrows */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          aria-label="Previous image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          aria-label="Next image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={image.image_url}
        alt={image.caption || 'Inspiration'}
        className="max-w-[90vw] max-h-[80vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Caption + source */}
      {(image.caption || image.source_url) && (
        <div
          className="mt-4 text-center max-w-xl px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {image.caption && (
            <p className="font-serif text-lg text-white">{image.caption}</p>
          )}
          {image.source_url && (
            <a
              href={image.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-primary hover:underline mt-1 inline-block"
            >
              View source
            </a>
          )}
        </div>
      )}

      {/* Image counter */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-xs text-white/40">
        {currentIndex + 1} / {images.length}
      </p>
    </div>
  )
}
