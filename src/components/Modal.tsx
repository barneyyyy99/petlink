import { useEffect, type ReactNode } from 'react'
import { useStore } from '@/store/useStore'

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  desc,
  children,
  wide,
  testId,
}: {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  desc?: string
  children: ReactNode
  wide?: boolean
  testId?: string
}) {
  const mobile = useStore((s) => s.mobileMode)
  // Esc 关闭（§5.4 键盘可达性）
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // 手机端：从底部滑出的 bottom-sheet，锚定在手机外框内（absolute），蓝色主题
  if (mobile) {
    return (
      <div className="m-sheet app-no-drag absolute inset-0 z-[120] flex items-end bg-[rgba(17,25,40,.4)]" onClick={onClose}>
        <div
          data-testid={testId}
          className="animate-sheetup flex max-h-[94%] w-full flex-col overflow-hidden rounded-t-[24px] bg-[#f6f8fc]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex shrink-0 items-start justify-between gap-3 border-b border-[#eef1f6] bg-white px-5 pb-3 pt-4">
            <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#e2e6ee]" />
            <div className="mt-1 min-w-0">
              {eyebrow && <div className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#3D7FFF]">{eyebrow}</div>}
              <h3 className="my-0.5 truncate text-[18px] font-bold text-[#1B1E28]">{title}</h3>
              {desc && <p className="m-0 text-[11px] leading-relaxed text-[#8A90A0]">{desc}</p>}
            </div>
            <button className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f5fa] text-[18px] text-[#6b7280]" onClick={onClose} aria-label="关闭">×</button>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-4">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="app-no-drag fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(24,42,38,.28)] p-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        data-testid={testId}
        className={`max-h-[88vh] w-full overflow-auto rounded-[28px] border border-white/60 bg-[#fbfcfa] p-6 shadow-soft ${
          wide ? 'max-w-[980px]' : 'max-w-[720px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h3 className="my-1 text-xl font-bold">{title}</h3>
            {desc && <p className="m-0 text-xs leading-relaxed text-muted">{desc}</p>}
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf2ef] text-[#6e7f79]"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
