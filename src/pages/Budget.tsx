import { useBudget } from '../hooks/useBudget'
import { useAppSettings } from '../hooks/useAppSettings'
import { useCurrency } from '../contexts/CurrencyContext'
import BudgetDonut from '../components/BudgetDonut'
import BudgetStackedBar from '../components/BudgetStackedBar'
import BudgetConfigure from '../components/BudgetConfigure'

export default function Budget() {
  const {
    budgets,
    loading: budgetLoading,
    totalBudget,
    totalCommitted,
    totalWishlist,
    refetch,
    updateBoardBudget,
  } = useBudget()
  const {
    masterBudget,
    loading: settingsLoading,
    saveMasterBudget,
    refetch: refetchSettings,
  } = useAppSettings()

  const { formatPrice, currency, isLiveRate, liveRate } = useCurrency()

  const loading = budgetLoading || settingsLoading

  const totalInstalled = budgets.reduce((sum, b) => sum + b.installed_total, 0)
  const totalPins = budgets.reduce((sum, b) => sum + b.pin_count, 0)
  const displayBudget = masterBudget ?? totalBudget

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-sans text-on-surface-variant">Loading...</p>
      </div>
    )
  }

  async function handleSaved() {
    await refetchSettings()
    await refetch()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-4 lg:pt-8">
      {/* Header */}
      <section className="mt-8 mb-10">
        <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-primary-dark mb-2">
          Budget Overview
        </h1>
        {displayBudget > 0 ? (
          <p className="font-sans text-on-surface-variant">
            {formatPrice(totalCommitted)} committed of {formatPrice(displayBudget)} budget
          </p>
        ) : (
          <p className="font-sans text-on-surface-variant">
            {formatPrice(totalCommitted)} committed &middot; Set a budget below to track progress
          </p>
        )}
      </section>

      {/* Fallback rate warning */}
      {currency === 'USD' && !isLiveRate && (
        <div className="mb-6 px-4 py-3 bg-status-warning/10 rounded-lg flex items-start gap-2">
          <span className="text-status-warning text-sm mt-0.5">!</span>
          <p className="font-sans text-sm text-on-surface-variant">
            Live exchange rate unavailable. Using fallback rate of <strong>1 EUR = {liveRate} USD</strong>. You may want to look up the current rate.
          </p>
        </div>
      )}

      {/* Configure budgets (collapsible) */}
      <BudgetConfigure
        masterBudget={masterBudget}
        budgets={budgets}
        onSaveMasterBudget={saveMasterBudget}
        onSaveRoomBudget={updateBoardBudget}
        onSaved={handleSaved}
      />

      {/* Donut + Summary Cards — side by side on desktop */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Donut chart */}
        <div className="bg-surface-container-lowest rounded-xl p-6 flex items-center justify-center">
          <BudgetDonut
            budgets={budgets}
            totalCommitted={totalCommitted}
            masterBudget={masterBudget}
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
          <SummaryCard label="Total Pins" value={String(totalPins)} accent="bg-primary" />
          <SummaryCard label="Rooms" value={String(budgets.length)} accent="bg-secondary" />
          <SummaryCard label="Wishlist" value={formatPrice(totalWishlist)} accent="bg-tertiary" />
          <SummaryCard label="Committed" value={formatPrice(totalCommitted)} accent="bg-primary" />
          <SummaryCard label="Installed" value={formatPrice(totalInstalled)} accent="bg-status-success" />
          {displayBudget > 0 && (
            <SummaryCard
              label="Remaining"
              value={formatPrice(Math.max(displayBudget - totalCommitted, 0))}
              accent={totalCommitted > displayBudget ? 'bg-status-error' : 'bg-primary-dark'}
            />
          )}
        </div>
      </section>

      {/* Bar legend */}
      <section className="mb-4">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-xl font-semibold">By Room</h2>
          <div className="flex items-center gap-3 ml-auto">
            <span className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary-dark inline-block" /> Installed
            </span>
            <span className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Ordered
            </span>
            <span className="flex items-center gap-1 font-sans text-xs text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary/25 inline-block" /> Wishlist
            </span>
          </div>
        </div>
      </section>

      {/* Per-Room Breakdown */}
      <section className="mb-12">
        <div className="flex flex-col gap-4">
          {budgets.map((room) => (
            <div
              key={room.board_id}
              className="bg-surface-container-lowest rounded-xl p-5"
            >
              <BudgetStackedBar room={room} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accent}`} />
      <p className="font-serif text-xl font-semibold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  )
}
