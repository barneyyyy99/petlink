import { useEffect, useState, type ReactNode } from 'react'
import { C } from '@/mobile/theme'

/** iOS 风格状态栏 */
export function StatusBar({ color = C.ink }: { color?: string }) {
  const [clock, setClock] = useState(() => new Date().toTimeString().slice(0, 5))
  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date().toTimeString().slice(0, 5)), 20000)
    return () => window.clearInterval(t)
  }, [])
  return (
    <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[15px] font-semibold" style={{ color }}>
      <span className="tracking-tight">{clock}</span>
      <div className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" />
          <rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <path d="M8 11.2a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8z" />
          <path d="M8 5.1c1.7 0 3.3.66 4.5 1.85l1.3-1.33A8 8 0 008 3.2a8 8 0 00-5.8 2.42L3.5 6.95A6.3 6.3 0 018 5.1z" opacity=".9" />
          <path d="M8 1.2c2.75 0 5.3 1.07 7.2 3L16 2.9A11.4 11.4 0 008 0 11.4 11.4 0 000 2.9L.8 4.2A9.9 9.9 0 018 1.2z" opacity=".75" />
        </svg>
        <div className="flex items-center gap-0.5">
          <div className="relative h-[12px] w-[24px] rounded-[4px] border" style={{ borderColor: 'currentColor', opacity: 0.6 }}>
            <div className="absolute inset-[1.5px] right-[6px] rounded-[2px]" style={{ background: 'currentColor' }} />
          </div>
          <div className="h-[5px] w-[1.5px] rounded-r" style={{ background: 'currentColor', opacity: 0.6 }} />
        </div>
      </div>
    </div>
  )
}

/** 白色圆角卡片 */
export function Card({ className = '', children, onClick, style }: { className?: string; children: ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const Tag: any = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} style={style} className={`block w-full rounded-[18px] bg-white p-4 text-left shadow-[0_6px_20px_rgba(31,60,120,.07)] ${onClick ? 'transition active:scale-[.985]' : ''} ${className}`}>
      {children}
    </Tag>
  )
}

/** 区块标题 + 右侧动作 */
export function SectionHeader({ title, extra, onExtra }: { title: string; extra?: string; onExtra?: () => void }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h3 className="text-[16px] font-bold" style={{ color: C.ink }}>{title}</h3>
      {extra && <button className="text-[13px] font-semibold" style={{ color: C.sub }} onClick={onExtra}>{extra}</button>}
    </div>
  )
}

/** 环形进度分值 */
export function Ring({ value, label, size = 64, color = C.primary }: { value: number; label: string; size?: number; color?: string }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, value)) / 100)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F8" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[18px] font-extrabold" style={{ color: C.ink }}>{value}</span>
      </div>
      <span className="text-[12px]" style={{ color: C.sub }}>{label}</span>
    </div>
  )
}

/** 底部抽屉（手机端二级/三级交互） */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-[60] flex items-end bg-black/35" onClick={onClose}>
      <div className="animate-sheetup max-h-[86%] w-full overflow-y-auto rounded-t-[24px] bg-white pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-[#f0f2f7] bg-white px-5 py-3.5">
          <b className="text-[16px]" style={{ color: C.ink }}>{title}</b>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-[#f2f5fa] text-[#6b7280]" aria-label="关闭">×</button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  )
}
