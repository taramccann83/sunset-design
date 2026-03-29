import { useCurrency } from '../contexts/CurrencyContext'

interface BudgetBarProps {
  label: string
  budget: number | null
  spent: number
  showAmount?: boolean
}

export default function BudgetBar({
  label,
  budget,
  spent,
  showAmount = true,
}: BudgetBarProps) {
  const { formatPrice } = useCurrency()
  const isOverBudget = budget !== null && spent > budget
  const percentage = budget ? Math.min((spent / budget) * 100, 100) : 0

  return (
    <div className="w-full space-y-1.5">
      <span className="font-sans font-medium text-sm text-on-surface">{label}</span>

      {budget !== null ? (
        <>
          <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-status-error' : 'gradient-primary'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {showAmount && (
            <p className="text-xs text-on-surface-variant">
              {formatPrice(spent)} / {formatPrice(budget)}
            </p>
          )}
        </>
      ) : (
        showAmount && (
          <p className="text-xs text-on-surface-variant">{formatPrice(spent)}</p>
        )
      )}
    </div>
  )
}
