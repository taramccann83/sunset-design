interface InspoAddCardProps {
  onClick: () => void
}

export default function InspoAddCard({ onClick }: InspoAddCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add inspiration image"
      className="break-inside-avoid mb-4 border-2 border-dashed border-outline-variant/40 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-low transition-all duration-200 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary/50"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-on-surface-variant/50 mb-2"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span className="font-sans text-sm text-on-surface-variant">
        Add Inspiration
      </span>
    </div>
  )
}
