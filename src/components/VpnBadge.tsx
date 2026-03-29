interface VpnBadgeProps {
  className?: string
}

export default function VpnBadge({ className = '' }: VpnBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-secondary text-white text-xs font-sans font-medium px-2 py-0.5 rounded-full ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.83-3.23 9.36-7 10.58-3.77-1.22-7-5.75-7-10.58V6.3l7-3.12z" />
        <path d="M10 12l-2-2-1.41 1.41L10 14.83l6-6L14.59 7.42z" />
      </svg>
      VPN
    </span>
  )
}
