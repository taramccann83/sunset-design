import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInspoImages } from '../hooks/useInspoImages'
import { useInspoMutations } from '../hooks/useInspoMutations'
import InspoCard from '../components/InspoCard'
import InspoAddCard from '../components/InspoAddCard'
import InspoUploadDialog from '../components/InspoUploadDialog'
import InspoLightbox from '../components/InspoLightbox'
import type { InspoImage } from '../types'

export default function MoodBoard() {
  const { images, loading, refetch } = useInspoImages()
  const { deleteInspoImage } = useInspoMutations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function handleImageClick(image: InspoImage) {
    const idx = images.findIndex((img) => img.id === image.id)
    setLightboxIndex(idx)
  }

  async function handleDelete(image: InspoImage) {
    await deleteInspoImage(image.id)
    setLightboxIndex(null)
    refetch()
  }

  function handleAdded() {
    setDialogOpen(false)
    refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-sans text-on-surface-variant">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
      <Link
        to="/rooms"
        className="text-sm font-sans text-on-surface-variant hover:text-primary-dark mb-4 inline-block"
      >
        &larr; Rooms
      </Link>

      <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-primary-dark mb-8">
        Mood Board
      </h1>

      {/* Masonry grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        <InspoAddCard onClick={() => setDialogOpen(true)} />
        {images.map((image) => (
          <InspoCard key={image.id} image={image} onClick={handleImageClick} onDelete={handleDelete} />
        ))}
      </div>

      {/* Upload dialog */}
      <InspoUploadDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={handleAdded}
      />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <InspoLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
