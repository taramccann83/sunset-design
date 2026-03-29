import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import type { BudgetSummary } from '../types'

const ROOM_COLORS = [
  '#FF7E5F', // sunset coral
  '#a13920', // deep terracotta
  '#D4AF37', // golden ochre
  '#7a9a6d', // sage green
  '#001F3F', // navy
  '#c4856a', // dusty rose
  '#8b7355', // warm taupe
  '#5b5c59', // warm gray
]

interface BudgetDonutProps {
  budgets: BudgetSummary[]
  totalCommitted: number
  masterBudget: number | null
}

export default function BudgetDonut({ budgets, totalCommitted, masterBudget }: BudgetDonutProps) {
  const { formatPrice } = useCurrency()
  const data = budgets
    .filter((b) => b.committed_total > 0)
    .map((b, i) => ({
      name: b.board_name,
      value: b.committed_total,
      color: ROOM_COLORS[i % ROOM_COLORS.length],
    }))

  // If nothing committed yet, show a placeholder
  if (data.length === 0) {
    data.push({ name: 'No spending yet', value: 1, color: '#edeae4' })
  }

  const overBudget = masterBudget != null && totalCommitted > masterBudget

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[240px] h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatPrice(value)}
              contentStyle={{
                background: '#f8f6f2',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(46,47,45,0.06)',
                fontSize: '13px',
                fontFamily: 'Manrope, sans-serif',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-serif text-2xl font-semibold text-on-surface">
            {formatPrice(totalCommitted)}
          </span>
          <span className="font-sans text-xs text-on-surface-variant">committed</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 max-w-sm">
        {budgets
          .filter((b) => b.committed_total > 0)
          .map((b, i) => (
            <div key={b.board_id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: ROOM_COLORS[i % ROOM_COLORS.length] }}
              />
              <span className="font-sans text-xs text-on-surface-variant">
                {b.board_name}
              </span>
            </div>
          ))}
      </div>

      {/* Over budget callout */}
      {overBudget && (
        <div className="mt-4 px-4 py-2 bg-status-error/10 rounded-lg">
          <p className="font-sans text-sm font-medium text-status-error">
            Over budget by {formatPrice(totalCommitted - masterBudget!)}
          </p>
        </div>
      )}
    </div>
  )
}
