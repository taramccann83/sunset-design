import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAppSettings() {
  const [masterBudget, setMasterBudget] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'master_budget')
      .single()

    if (data?.value?.amount != null) {
      setMasterBudget(data.value.amount)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function saveMasterBudget(amount: number): Promise<boolean> {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'master_budget', value: { amount } })

    if (!error) setMasterBudget(amount)
    return !error
  }

  return { masterBudget, loading, saveMasterBudget, refetch: fetchSettings }
}
