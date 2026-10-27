import { createContext, useContext, useState, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { StatusBar } from '@/mobile/MobileShell'

export type SubKey = 'collar' | 'persona' | 'voice' | 'linked' | 'widget' | 'account' | 'superdu' | 'fence' | 'growth' | 'healthDetail' | 'album' | 'care' | 'family' | 'diary'

type Nav = { openSub: (k: SubKey) => void; back: () => void }
const NavCtx = createContext<Nav>({ openSub: () => {}, back: () => {} })
export const useNav = () => useContext(NavCtx)

export function NavProvider({ children, render }: { children: ReactNode; render: (sub: SubKey) => ReactNode }) {
  const [sub, setSub] = useState<SubKey | null>(null)
  return (
    <NavCtx.Provider value={{ openSub: setSub, back: () => setSub(null) }}>
      {children}
      {sub && (
        <div className="animate-slidein absolute inset-0 z-50 flex flex-col overflow-hidden" style={{ background: G.page }}>
          {render(sub)}
        </div>
      )}
    </NavCtx.Provider>
  )
}

/** 二级页外壳：状态栏 + 返回头 + 可滚动内容（手机端规格，非电脑弹窗） */
export function SubScreen({ title, right, onRight, dark = false, fill = false, children }: { title: string; right?: string; onRight?: () => void; dark?: boolean; fill?: boolean; children: ReactNode }) {
  const { back } = useNav()
  return (
    <>
      <StatusBar color={dark ? '#fff' : C.ink} />
      <div className="flex h-12 shrink-0 items-center justify-between px-2" style={{ color: dark ? '#fff' : C.ink }}>
        <button onClick={back} className="grid h-9 w-9 place-items-center rounded-full active:bg-black/5" aria-label="返回"><ChevronLeft size={24} /></button>
        <div className="text-[17px] font-bold">{title}</div>
        <div className="min-w-[36px] pr-1 text-right">
          {right ? <button className="text-[14px] font-semibold" style={{ color: C.primary }} onClick={onRight}>{right}</button> : <span className="inline-block w-9" />}
        </div>
      </div>
      {fill ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      ) : (
        <div className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-1">{children}</div>
      )}
    </>
  )
}
