import { type ReactNode } from 'react'

type EmptyStateType = 'pins' | 'search' | 'budget'

interface EmptyStateProps {
  type: EmptyStateType
  message?: string
  actionLabel?: string
  onAction?: () => void
}

const defaultMessages: Record<EmptyStateType, string> = {
  pins: 'Nothing pinned yet — start collecting inspiration.',
  search: 'No results found. Try a different search.',
  budget: 'No budget set for this room yet.',
}

/* Minimalist SVG illustrations using Algarve Twilight palette */

function PinsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Picture frame outline */}
      <rect
        x="24"
        y="20"
        width="72"
        height="80"
        rx="4"
        stroke="#001F3F"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.3"
      />
      {/* Inner mat */}
      <rect
        x="32"
        y="28"
        width="56"
        height="56"
        rx="2"
        fill="#f8f6f2"
      />
      {/* Sunset sky gradient */}
      <defs>
        <linearGradient id="empty-sunset" x1="32" y1="28" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7E5F" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#fe7d5e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect x="32" y="28" width="56" height="36" rx="2" fill="url(#empty-sunset)" />
      {/* Sun circle */}
      <circle cx="60" cy="48" r="8" fill="#FF7E5F" opacity="0.6" />
      {/* Ocean waves */}
      <path
        d="M32 64 Q44 58, 56 64 Q68 70, 88 64 L88 84 L32 84 Z"
        fill="#001F3F"
        opacity="0.15"
      />
      <path
        d="M32 68 Q46 62, 60 68 Q74 74, 88 68 L88 84 L32 84 Z"
        fill="#001F3F"
        opacity="0.1"
      />
    </svg>
  )
}

function SearchIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="empty-search-fill" cx="54" cy="52" r="22" gradientUnits="userSpaceOnUse"
          x1="32" y1="30" x2="76" y2="74">
          <stop offset="0%" stopColor="#FF7E5F" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Magnifying glass lens fill */}
      <circle cx="54" cy="52" r="24" fill="url(#empty-search-fill)" />
      {/* Lens ring */}
      <circle
        cx="54"
        cy="52"
        r="24"
        stroke="#001F3F"
        strokeWidth="2.5"
        opacity="0.3"
        fill="none"
      />
      {/* Handle */}
      <line
        x1="72"
        y1="70"
        x2="90"
        y2="88"
        stroke="#001F3F"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Small sunset arc inside lens */}
      <path
        d="M38 58 Q46 48, 54 52 Q62 56, 70 50"
        stroke="#FF7E5F"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
        fill="none"
      />
      {/* Tiny sun dot */}
      <circle cx="54" cy="44" r="4" fill="#FF7E5F" opacity="0.4" />
    </svg>
  )
}

function BudgetIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="empty-budget-glow" cx="60" cy="56" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FF7E5F" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {/* Warm glow behind coin */}
      <circle cx="60" cy="56" r="36" fill="url(#empty-budget-glow)" />
      {/* Coin body */}
      <ellipse
        cx="60"
        cy="56"
        rx="22"
        ry="22"
        stroke="#D4AF37"
        strokeWidth="2.5"
        opacity="0.45"
        fill="none"
      />
      {/* Inner coin ring */}
      <ellipse
        cx="60"
        cy="56"
        rx="16"
        ry="16"
        stroke="#D4AF37"
        strokeWidth="1"
        opacity="0.25"
        fill="none"
      />
      {/* Euro/currency symbol */}
      <text
        x="60"
        y="62"
        textAnchor="middle"
        fontFamily="'Noto Serif', Georgia, serif"
        fontSize="18"
        fill="#D4AF37"
        opacity="0.45"
      >
        {'€'}
      </text>
      {/* Subtle shine arc */}
      <path
        d="M46 42 Q52 36, 60 38"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
        fill="none"
      />
    </svg>
  )
}

const illustrations: Record<EmptyStateType, () => ReactNode> = {
  pins: PinsIllustration,
  search: SearchIllustration,
  budget: BudgetIllustration,
}

export default function EmptyState({
  type,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Illustration = illustrations[type]
  const displayMessage = message ?? defaultMessages[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="mb-6">
        <Illustration />
      </div>
      <p className="font-serif text-lg text-on-surface-variant text-center max-w-xs">
        {displayMessage}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 gradient-primary text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-md transition-all duration-200 cursor-pointer hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
