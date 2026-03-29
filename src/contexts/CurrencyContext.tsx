import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, pinPriceInEur, currencySymbol } from '../lib/format'
import type { Currency } from '../types'

const FALLBACK_RATE = 1.08
const RATE_API = 'https://api.frankfurter.dev/v1/latest?from=EUR&to=USD'

interface CurrencyContextValue {
  currency: Currency
  toggleCurrency: () => void
  liveRate: number
  isLiveRate: boolean
  formatPrice: (amountEur: number) => string
  convertPinPrice: (priceEur: number | null, priceCurrency: Currency, exchangeRate: number | null) => number
  formatPinPrice: (priceEur: number | null, priceCurrency: Currency, exchangeRate: number | null) => string | null
  symbol: string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [liveRate, setLiveRate] = useState(FALLBACK_RATE)
  const [isLiveRate, setIsLiveRate] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load preference + live rate on mount
  useEffect(() => {
    async function init() {
      // Load preference
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'currency_preference')
        .maybeSingle()

      if (data?.value?.currency) {
        setCurrency(data.value.currency as Currency)
      }

      // Fetch live rate
      let rateFetched = false
      try {
        const res = await fetch(RATE_API)
        if (res.ok) {
          const json = await res.json()
          if (json.rates?.USD) {
            setLiveRate(json.rates.USD)
            rateFetched = true
          }
        }
      } catch {
        // Keep fallback rate
      }

      setIsLiveRate(rateFetched)
      setLoaded(true)
    }
    init()
  }, [])

  const toggleCurrency = useCallback(async () => {
    const next = currency === 'EUR' ? 'USD' : 'EUR'
    setCurrency(next)
    await supabase
      .from('app_settings')
      .upsert({ key: 'currency_preference', value: { currency: next } })
  }, [currency])

  const formatPrice = useCallback(
    (amountEur: number) => formatCurrency(amountEur, currency, liveRate),
    [currency, liveRate],
  )

  // Convert a pin's stored price to EUR (for budget math)
  const convertPinPrice = useCallback(
    (priceEur: number | null, priceCurrency: Currency, exchangeRate: number | null) =>
      pinPriceInEur(priceEur, priceCurrency, exchangeRate, liveRate),
    [liveRate],
  )

  // Format a pin's price for display in the current display currency
  const formatPinPrice = useCallback(
    (priceEur: number | null, priceCurrency: Currency, exchangeRate: number | null) => {
      if (priceEur == null) return null
      // First convert to EUR
      const eurAmount = pinPriceInEur(priceEur, priceCurrency, exchangeRate, liveRate)
      // Then format in display currency
      return formatCurrency(eurAmount, currency, liveRate)
    },
    [currency, liveRate],
  )

  const symbol = currencySymbol(currency)

  if (!loaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-sans text-on-surface-variant">Loading...</p>
      </div>
    )
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, toggleCurrency, liveRate, isLiveRate, formatPrice, convertPinPrice, formatPinPrice, symbol }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
