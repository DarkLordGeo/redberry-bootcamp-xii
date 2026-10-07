import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
  /** Extra header content under the title (e.g. step indicator). */
  header?: ReactNode
  /** Small line under the title, e.g. "Welcome back to Kino XII". */
  subtitle?: ReactNode
  labelledBy?: string
}

/** Open modals, newest last: only the top one reacts to Escape (e.g. login opened over booking). */
const stack: symbol[] = []

/**
 * Shared modal: dimmed + blurred backdrop, closes on X, Escape and backdrop click.
 * Focus moves into the dialog on open and returns to the trigger on close.
 */
export function Modal({ open, onClose, title, children, footer, width = 'max-w-[440px]', header, subtitle }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const id = Symbol('modal')
    stack.push(id)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) {
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')
      ;(first ?? panelRef.current)?.focus()
    })
    return () => {
      stack.splice(stack.indexOf(id), 1)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 px-3 py-6 backdrop-blur-md sm:px-4 sm:py-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={`relative my-auto w-full ${width} rounded-[20px] border border-line/60 bg-ink-2 shadow-2xl shadow-black/50 outline-none`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-mute">{subtitle}</p>}
            {header}
          </div>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 grid size-9 shrink-0 place-items-center rounded-md text-mute hover:bg-ink-3 hover:text-screen"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7">{children}</div>
        {footer && <div className="px-5 pb-6 sm:px-7">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
