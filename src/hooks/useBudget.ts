import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { pinPriceInEur } from '../lib/format'
import { useCurrency } from '../contexts/CurrencyContext'
import type { BudgetSummary, Currency } from '../types'

export function useBudget() {
  const [budgets, setBudgets] = useState<BudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const { liveRate } = useCurrency()

  const fetchBudgets = useCallback(async () => {
    const { data: boards } = await supabase
      .from('boards')
      .select('id, name, budget_eur, sort_order')
      .order('sort_order')

    if (!boards) { setLoading(false); return }

    const { data: pins } = await supabase
      .from('pins')
      .select('board_id, price_eur, price_currency, exchange_rate, status')

    function toEur(p: { price_eur: number | null; price_currency: Currency; exchange_rate: number | null }): number {
      return pinPriceInEur(p.price_eur, p.price_currency, p.exchange_rate, liveRate)
    }

    const summaries: BudgetSummary[] = boards.map((board) => {
      const boardPins = (pins || []).filter((p) => p.board_id === board.id)
      const withPrice = boardPins.filter((p) => p.price_eur != null)

      return {
        board_id: board.id,
        board_name: board.name,
        budget_eur: board.budget_eur,
        wishlist_total: withPrice
          .filter((p) => p.status === 'wishlist' || p.status === 'shortlisted')
          .reduce((sum, p) => sum + toEur(p), 0),
        committed_total: withPrice
          .filter((p) => ['ordered', 'arrived', 'installed'].includes(p.status))
          .reduce((sum, p) => sum + toEur(p), 0),
        installed_total: withPrice
          .filter((p) => p.status === 'installed')
          .reduce((sum, p) => sum + toEur(p), 0),
        pin_count: boardPins.length,
      }
    })

    setBudgets(summaries)
    setLoading(false)
  }, [liveRate])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const totalBudget = budgets.reduce((s, b) => s + (b.budget_eur || 0), 0)
  const totalCommitted = budgets.reduce((s, b) => s + b.committed_total, 0)
  const totalWishlist = budgets.reduce((s, b) => s + b.wishlist_total, 0)

  async function updateBoardBudget(boardId: string, budgetEur: number | null): Promise<boolean> {
    const { error } = await supabase
      .from('boards')
      .update({ budget_eur: budgetEur })
      .eq('id', boardId)

    return !error
  }

  return { budgets, loading, totalBudget, totalCommitted, totalWishlist, refetch: fetchBudgets, updateBoardBudget }
}
