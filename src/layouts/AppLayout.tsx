import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useCurrency } from '../contexts/CurrencyContext'

const navItems = [
  {
    label: 'Home',
    path: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Rooms',
    path: '/rooms',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Search',
    path: '/search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Budget',
    path: '/budget',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="0.5" />
        <rect x="10" y="7" width="4" height="14" rx="0.5" />
        <rect x="17" y="3" width="4" height="18" rx="0.5" />
      </svg>
    ),
  },
]

function CurrencyToggle({ className }: { className?: string }) {
  const { currency, toggleCurrency, isLiveRate, liveRate } = useCurrency()

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={toggleCurrency}
        className={`flex items-center justify-center rounded-lg font-sans text-xs font-bold cursor-pointer transition-all duration-200 ${className}`}
        aria-label={`Switch to ${currency === 'EUR' ? 'USD' : 'EUR'}`}
        title={isLiveRate ? `Live rate: 1 EUR = ${liveRate.toFixed(4)} USD` : `Using fallback rate (${liveRate}) — live rate unavailable`}
      >
        <span className={currency === 'EUR' ? 'text-white' : 'text-white/40'}>€</span>
        <span className="text-white/30 mx-0.5">/</span>
        <span className={currency === 'USD' ? 'text-white' : 'text-white/40'}>$</span>
      </button>
      {!isLiveRate && currency === 'USD' && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-status-warning" title="Using fallback rate — live rate unavailable" />
      )}
    </div>
  )
}

function DesktopRailNav() {
  const location = useLocation()

  return (
    <nav className="fixed left-0 top-0 z-50 hidden h-screen w-16 flex-col items-center py-6 bg-secondary lg:flex">
      <div className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out ${
                isActive
                  ? 'gradient-primary text-white'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
              aria-label={item.label}
            >
              {item.icon}
            </NavLink>
          )
        })}
      </div>
      <CurrencyToggle className="h-10 w-10 hover:bg-white/10 mb-2" />
    </nav>
  )
}

function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl pb-2 shadow-ambient-lg bg-secondary lg:hidden">
      <div className="flex items-center justify-around px-2 pt-2">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex min-w-[3rem] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all duration-200 ease-out ${
                isActive ? 'text-white' : 'text-white/90'
              }`}
              aria-label={item.label}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  isActive ? 'gradient-primary text-white' : ''
                }`}
              >
                {item.icon}
              </span>
              {isActive && (
                <span className="font-sans text-xs font-semibold">
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
        <CurrencyToggle className="h-8 w-8 ml-1" />
      </div>
    </nav>
  )
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <DesktopRailNav />
      <MobileBottomNav />

      {/* Desktop: offset for rail + margins. Mobile: bottom padding for tab bar. */}
      <main className="pb-20 lg:ml-16 lg:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
