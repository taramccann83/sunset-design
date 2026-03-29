import type { Pin } from '../types'
import { useCurrency } from '../contexts/CurrencyContext'
import StatusBadge from './StatusBadge'

interface PinCardProps {
  pin: Pin
  onClick?: (pin: Pin) => void
}

export default function PinCard({ pin, onClick, style }: PinCardProps & { style?: React.CSSProperties }) {
  const { formatPinPrice } = useCurrency()
  const formattedPrice = formatPinPrice(pin.price_eur, pin.price_currency, pin.exchange_rate)

  return (
    <div
      className="bg-surface-container-lowest rounded-md cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-card-hover animate-fade-in-up"
      style={style}
      onClick={() => onClick?.(pin)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md">
        <img
          src={pin.image_url}
          alt={pin.product_name ?? 'Pin image'}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <StatusBadge status={pin.status} />
        </div>
      </div>

      <div className="p-3">
        <p className="font-serif text-lg font-medium truncate">
          {pin.product_name ?? 'Untitled'}
        </p>

        {pin.store_name && (
          <p className="text-xs font-sans text-on-surface-variant">
            {pin.store_name}
          </p>
        )}

        {formattedPrice && (
          <p className="text-sm font-sans font-semibold text-primary-dark text-right">
            {formattedPrice}
          </p>
        )}
      </div>
    </div>
  )
}
