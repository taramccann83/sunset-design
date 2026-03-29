import type { PinStatus } from '../types'

interface StatusBadgeProps {
  status: PinStatus
}

const statusClasses: Record<PinStatus, string> = {
  wishlist: 'bg-surface-container-high text-on-surface',
  shortlisted: 'bg-tertiary/15 text-on-surface border border-tertiary/40',
  ordered: 'gradient-primary text-white',
  arrived: 'bg-primary text-white',
  installed: 'bg-status-success text-white',
  rejected: 'bg-surface-container-high text-on-surface-variant',
}

const statusLabels: Record<PinStatus, string> = {
  wishlist: 'Wishlist',
  shortlisted: 'Shortlisted',
  ordered: 'Ordered',
  arrived: 'Arrived',
  installed: 'Installed',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block text-xs font-sans font-medium px-2.5 py-0.5 rounded-full ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}
