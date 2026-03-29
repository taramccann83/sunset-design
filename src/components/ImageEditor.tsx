import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

interface ImageEditorProps {
  imageSrc: string
  onDone: (croppedBlob: Blob) => void
  onCancel: () => void
}

const ASPECT_OPTIONS = [
  { label: 'Free', value: undefined },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
] as const

async function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/jpeg',
      0.92,
    )
  })
}

export default function ImageEditor({ imageSrc, onDone, onCancel }: ImageEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(undefined)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function handleDone() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels)
      onDone(blob)
    } catch {
      setProcessing(false)
    }
  }

  function handleRotate() {
    setRotation((r) => (r + 90) % 360)
  }

  return (
    <div className="fixed inset-0 z-50 bg-secondary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary">
        <button
          onClick={onCancel}
          className="text-white/80 hover:text-white text-sm font-sans font-medium cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <h2 className="text-white font-serif text-base">Edit Photo</h2>
        <button
          onClick={handleDone}
          disabled={processing}
          className="text-primary font-sans font-semibold text-sm cursor-pointer transition-opacity disabled:opacity-40"
        >
          {processing ? 'Saving...' : 'Done'}
        </button>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          showGrid
          style={{
            containerStyle: { background: '#001F3F' },
            cropAreaStyle: {
              border: '2px solid rgba(255, 126, 95, 0.7)',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-secondary px-4 pt-3 pb-6 space-y-3">
        {/* Aspect ratio pills */}
        <div className="flex items-center justify-center gap-2">
          {ASPECT_OPTIONS.map((opt) => {
            const isActive =
              aspect === opt.value ||
              (aspect === undefined && opt.value === undefined)
            return (
              <button
                key={opt.label}
                onClick={() => setAspect(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-medium cursor-pointer transition-all ${
                  isActive
                    ? 'gradient-primary text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
          <button
            onClick={handleRotate}
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 cursor-pointer transition-all"
            aria-label="Rotate 90 degrees"
            title="Rotate"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2v6h6" />
              <path d="M2.5 8C5.5 3.5 11 2 15.5 4s7 7.5 5.5 12-7 7.5-11.5 5.5" />
            </svg>
          </button>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 px-2">
          <svg className="text-white/50 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary h-1 cursor-pointer"
          />
          <svg className="text-white/50 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>
      </div>
    </div>
  )
}
