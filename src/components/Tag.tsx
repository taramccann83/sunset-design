interface TagProps {
  label: string
  onRemove?: () => void
  active?: boolean
}

export default function Tag({ label, onRemove, active = false }: TagProps) {
  const base = 'inline-flex items-center gap-1 text-xs font-sans font-medium px-2.5 py-1 rounded-full transition-colors duration-200 group'

  const variant = active
    ? 'text-primary-dark border border-primary-dark'
    : 'bg-surface-container-low text-on-surface-variant'

  return (
    <span className={`${base} ${variant}`}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-current cursor-pointer"
          aria-label={`Remove ${label}`}
        >
          &times;
        </button>
      )}
    </span>
  )
}
