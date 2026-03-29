import { useState, useEffect } from 'react'
import { useCurrency } from '../contexts/CurrencyContext'
import type { BudgetSummary } from '../types'

interface BudgetConfigureProps {
  masterBudget: number | null
  budgets: BudgetSummary[]
  onSaveMasterBudget: (amount: number) => Promise<boolean>
  onSaveRoomBudget: (boardId: string, amount: number | null) => Promise<boolean>
  onSaved: () => void
}

export default function BudgetConfigure({
  masterBudget,
  budgets,
  onSaveMasterBudget,
  onSaveRoomBudget,
  onSaved,
}: BudgetConfigureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [masterInput, setMasterInput] = useState('')
  const [roomInputs, setRoomInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const { formatPrice, symbol } = useCurrency()

  // Sync inputs when data loads
  useEffect(() => {
    if (masterBudget != null) setMasterInput(String(masterBudget))
    const inputs: Record<string, string> = {}
    budgets.forEach((b) => {
      inputs[b.board_id] = b.budget_eur != null ? String(b.budget_eur) : ''
    })
    setRoomInputs(inputs)
  }, [masterBudget, budgets])

  const masterVal = masterInput ? Number(masterInput) : 0
  const roomTotal = Object.values(roomInputs).reduce(
    (sum, v) => sum + (v ? Number(v) : 0),
    0,
  )
  const diff = masterVal - roomTotal
  const isOver = diff < 0

  async function handleSave() {
    setSaving(true)

    if (masterInput) {
      await onSaveMasterBudget(Number(masterInput))
    }

    for (const [boardId, val] of Object.entries(roomInputs)) {
      const amount = val ? Number(val) : null
      await onSaveRoomBudget(boardId, amount)
    }

    setSaving(false)
    onSaved()
  }

  const inputClass =
    'bg-surface-container-high border-0 rounded-md px-3 py-2 text-sm font-sans text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary w-32 text-right'

  return (
    <div className="mb-10">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 font-sans text-sm font-medium text-primary-dark hover:text-primary transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Configure Budgets
      </button>

      {isOpen && (
        <div className="mt-4 bg-surface-container-lowest rounded-xl p-6">
          {/* Master budget */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-outline-variant/15">
            <div>
              <p className="font-sans font-medium text-sm text-on-surface">Master Budget</p>
              <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                Total budget for the entire condo
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-sans text-sm text-on-surface-variant">{symbol}</span>
              <input
                type="number"
                value={masterInput}
                onChange={(e) => setMasterInput(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          {/* Per-room budgets */}
          <div className="space-y-3 mb-6">
            {budgets.map((b) => (
              <div key={b.board_id} className="flex items-center justify-between">
                <span className="font-sans text-sm text-on-surface">{b.board_name}</span>
                <div className="flex items-center gap-1">
                  <span className="font-sans text-sm text-on-surface-variant">{symbol}</span>
                  <input
                    type="number"
                    value={roomInputs[b.board_id] || ''}
                    onChange={(e) =>
                      setRoomInputs((prev) => ({ ...prev, [b.board_id]: e.target.value }))
                    }
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Allocation status */}
          {masterInput && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-6 ${
              isOver ? 'bg-status-error/10' : diff > 0 ? 'bg-surface-container-high' : 'bg-status-success/10'
            }`}>
              <span className="font-sans text-xs text-on-surface-variant">
                Room allocations: {formatPrice(roomTotal)}
              </span>
              <span className={`font-sans text-xs font-medium ${
                isOver ? 'text-status-error' : diff > 0 ? 'text-on-surface-variant' : 'text-status-success'
              }`}>
                {isOver
                  ? `Over budget by ${formatPrice(Math.abs(diff))}`
                  : diff > 0
                    ? `${formatPrice(diff)} unallocated`
                    : 'Fully allocated'}
              </span>
            </div>
          )}

          {/* Save button */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="gradient-primary text-white font-sans font-medium text-sm px-6 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save Budgets'}
          </button>
        </div>
      )}
    </div>
  )
}
