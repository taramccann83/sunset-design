interface SkeletonCardProps {
  type?: 'pin' | 'board'
}

export default function SkeletonCard({ type = 'pin' }: SkeletonCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-md overflow-hidden">
      <div className={`${type === 'board' ? 'aspect-[4/3]' : 'aspect-[4/3]'} bg-surface-container-high animate-skeleton rounded-md`} />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-surface-container-high animate-skeleton rounded" />
        <div className="h-3 w-1/2 bg-surface-container-high animate-skeleton rounded" style={{ animationDelay: '200ms' }} />
        {type === 'pin' && (
          <div className="h-3 w-1/4 bg-surface-container-high animate-skeleton rounded ml-auto" style={{ animationDelay: '400ms' }} />
        )}
      </div>
    </div>
  )
}
