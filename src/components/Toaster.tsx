import { useStore } from '@/store/useStore'

const kindStyle: Record<string, string> = {
  success: 'bg-[rgba(30,52,46,.94)]',
  info: 'bg-[rgba(30,52,46,.94)]',
  warn: 'bg-[rgba(150,90,20,.95)]',
  error: 'bg-[rgba(150,40,40,.95)]',
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="fixed left-1/2 top-6 z-[220] flex -translate-x-1/2 flex-col items-center gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          data-testid="toast"
          className={`animate-pop rounded-2xl px-4 py-2.5 text-xs text-white shadow-soft ${kindStyle[t.kind] ?? kindStyle.info}`}
        >
          {t.kind === 'error' ? '✕ ' : t.kind === 'warn' ? '⚠ ' : '✓ '}
          {t.text}
        </div>
      ))}
    </div>
  )
}
