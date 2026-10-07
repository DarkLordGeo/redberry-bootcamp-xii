import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type Tone = 'info' | 'success' | 'error' | 'warning'
interface Toast {
  id: number
  tone: Tone
  message: string
}

const ToastCtx = createContext<{ push: (message: string, tone?: Tone) => void } | null>(null)

const toneClass: Record<Tone, string> = {
  info: 'border-line',
  success: 'border-ok/60',
  error: 'border-err/70',
  warning: 'border-brass/70',
}
const dotClass: Record<Tone, string> = {
  info: 'bg-mute',
  success: 'bg-ok',
  error: 'bg-err',
  warning: 'bg-brass',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const next = useRef(1)

  const push = useCallback((message: string, tone: Tone = 'info') => {
    const id = next.current++
    setToasts((t) => [...t, { id, tone, message }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-md border bg-ink-2 px-4 py-3 text-sm shadow-xl shadow-black/40 ${toneClass[t.tone]}`}
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dotClass[t.tone]}`} />
            <span className="flex-1">{t.message}</span>
            <button
              className="text-mute hover:text-screen"
              aria-label="Dismiss"
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast outside ToastProvider')
  return ctx
}
