import type { Currency } from '../types'

export function formatEuro(amount: number): string {
  return `\u20AC${amount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function formatEuroDecimal(amount: number): string {
  return `\u20AC${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCurrency(amountEur: number, displayCurrency: Currency, rate: number): string {
  if (displayCurrency === 'EUR') {
    return `\u20AC${amountEur.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
  const converted = amountEur * rate
  return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * Convert a pin's stored price to EUR for budget calculations.
 * - If pin was priced in EUR: return price as-is
 * - If pin was priced in USD with a locked exchange_rate: convert using that rate
 * - If pin was priced in USD without a rate: use the live rate
 */
export function pinPriceInEur(
  priceEur: number | null,
  priceCurrency: Currency,
  exchangeRate: number | null,
  liveRate: number,
): number {
  if (priceEur == null) return 0
  if (priceCurrency === 'EUR') return priceEur
  // Price is in USD — convert to EUR
  const rate = exchangeRate ?? liveRate
  return rate > 0 ? priceEur / rate : 0
}

export function currencySymbol(currency: Currency): string {
  return currency === 'EUR' ? '\u20AC' : '$'
}
