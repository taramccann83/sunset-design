import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-surface-container-lowest rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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

        {title && (
          <h2 className="font-serif text-xl font-semibold px-6 pt-6 pb-2">
            {title}
          </h2>
        )}

        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}
