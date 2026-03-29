import { useState, useEffect, useCallback, createContext, useContext } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: number
  text: string
  type: ToastType
}

interface ToastContextValue {
  toast: (text: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback((text: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, text, type }])
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(() => onDismiss(toast.id), 300)
      return () => clearTimeout(timer)
    }
  }, [exiting, toast.id, onDismiss])

  const bgColor = {
    success: 'bg-status-success',
    error: 'bg-status-error',
    info: 'bg-secondary',
  }[toast.type]

  const icon = {
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }[toast.type]

  return (
    <div
      className={`${bgColor} text-white px-4 py-2.5 rounded-lg shadow-ambient-lg flex items-center gap-2 font-sans text-sm pointer-events-auto cursor-pointer ${
        exiting ? 'animate-slide-down' : 'animate-slide-up'
      }`}
      onClick={() => setExiting(true)}
    >
      {icon}
      {toast.text}
    </div>
  )
}
