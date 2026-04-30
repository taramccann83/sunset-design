import { useRef } from 'react'
import { createPortal } from 'react-dom'

interface ImagePickerProps {
  images: string[]
  selectedImage: string | null
  onSelect: (imageUrl: string) => void
  onUpload: (file: File) => void
  onClose: () => void
}

export default function ImagePicker({
  images,
  selectedImage,
  onSelect,
  onUpload,
  onClose,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
    e.target.value = ''
  }

  return createPortal(
    <div className="fixed inset-0 z-100 bg-secondary flex flex-col" style={{ touchAction: 'pan-y' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary safe-area-top">
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-sm font-sans font-medium cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center"
        >
          Cancel
        </button>
        <h2 className="text-white font-serif text-base">Choose a photo</h2>
        <div className="min-w-[44px]" />
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => {
              const isSelected = selectedImage === img
              return (
                <button
                  key={img}
                  onClick={() => onSelect(img)}
                  className={`aspect-square rounded-lg overflow-hidden bg-white/5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-3 ring-primary'
                      : 'ring-1 ring-white/10 hover:ring-white/30'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/50 font-sans text-sm text-center px-6">
            No photos found from this page. Upload one from your phone instead.
          </div>
        )}
      </div>

      {/* Footer with Upload button */}
      <div className="px-4 pt-3 pb-6 bg-secondary safe-area-bottom border-t border-white/10">
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 gradient-primary text-white font-sans font-semibold text-sm rounded-full py-3 min-h-[48px] cursor-pointer transition-transform active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Upload from phone
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>,
    document.body,
  )
}
