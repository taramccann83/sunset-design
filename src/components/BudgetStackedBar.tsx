import { useCurrency } from '../contexts/CurrencyContext'
import type { BudgetSummary } from '../types'

interface BudgetStackedBarProps {
  room: BudgetSummary
}

export default function BudgetStackedBar({ room }: BudgetStackedBarProps) {
  const { formatPrice } = useCurrency()
  const { installed_total, committed_total, wishlist_total, budget_eur, pin_count } = room

  // committed_total includes installed, so ordered+arrived = committed - installed
  const orderedArrived = committed_total - installed_total
  const total = committed_total + wishlist_total
  const barMax = budget_eur != null ? Math.max(budget_eur, total) : total

  const installedPct = barMax > 0 ? (installed_total / barMax) * 100 : 0
  const orderedPct = barMax > 0 ? (orderedArrived / barMax) * 100 : 0
  const wishlistPct = barMax > 0 ? (wishlist_total / barMax) * 100 : 0
  const budgetPct = budget_eur != null && barMax > 0 ? (budget_eur / barMax) * 100 : null

  const isOverBudget = budget_eur != null && committed_total > budget_eur

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-sans font-medium text-sm text-on-surface">{room.board_name}</h3>
        <span className="font-sans text-xs text-on-surface-variant">
          {pin_count} {pin_count === 1 ? 'pin' : 'pins'}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="relative h-3 w-full rounded-full bg-surface-container-high overflow-visible">
        <div className="h-full rounded-full overflow-hidden flex">
          {installedPct > 0 && (
            <div
              className="h-full bg-primary-dark"
              style={{ width: `${installedPct}%` }}
              title={`Installed: ${formatPrice(installed_total)}`}
            />
          )}
          {orderedPct > 0 && (
            <div
              className="h-full bg-primary"
              style={{ width: `${orderedPct}%` }}
              title={`Ordered/Arrived: ${formatPrice(orderedArrived)}`}
            />
          )}
          {wishlistPct > 0 && (
            <div
              className="h-full bg-primary/25"
              style={{ width: `${wishlistPct}%` }}
              title={`Wishlist: ${formatPrice(wishlist_total)}`}
            />
          )}
        </div>

        {/* Budget marker */}
        {budgetPct != null && (
          <div
            className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-on-surface/40 rounded-full"
            style={{ left: `${Math.min(budgetPct, 100)}%` }}
            title={`Budget: ${formatPrice(budget_eur!)}`}
          />
        )}
      </div>

      {/* Amounts */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary-dark inline-block" />
            {formatPrice(installed_total)}
          </span>
          <span className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {formatPrice(orderedArrived)}
          </span>
          <span className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary/25 inline-block" />
            {formatPrice(wishlist_total)}
          </span>
        </div>
        {budget_eur != null && (
          <span className={`font-sans text-xs font-medium ${isOverBudget ? 'text-status-error' : 'text-on-surface-variant'}`}>
            / {formatPrice(budget_eur)}
          </span>
        )}
      </div>
    </div>
  )
}
