import { useEffect, useState } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { LiveMap } from '@/components/map/LiveMap'
import { Room3D, type RoomStyle } from '@/components/map/Room3D'
import { behaviorLabel } from '@/lib/tracking'

const STYLE_OPTS: { id: RoomStyle; label: string }[] = [
  { id: 'cartoon', label: '清爽' },
  { id: 'warm', label: '暖阳' },
  { id: 'night', label: '夜间' },
]

/** 浮窗 / 桌面组件模式：仅显示当前宠物所处房间（可切 3D 立体卡通），宠物实时移动。?mini=1 进入。 */
export function MiniWidget() {
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const activePetId = useStore((s) => s.activePetId)
  const setActivePet = useStore((s) => s.setActivePet)
  const room = useStore(currentRoom)
  const setMapMode = useStore((s) => s.setMapMode)
  const simulateNextRoom = useStore((s) => s.simulateNextRoom)
  const [view, setView] = useState<'3d' | 'flat'>('3d')
  const [style, setStyle] = useState<RoomStyle>('cartoon')

  useEffect(() => {
    setMapMode('live')
  }, [setMapMode])

  // 环境动效：周期性让宠物在房间之间走动（演示数据）
  useEffect(() => {
    const t = setInterval(() => simulateNextRoom(), 16000)
    return () => clearInterval(t)
  }, [simulateNextRoom])

  const exit = () => {
    window.close()
    window.location.href = window.location.pathname
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#eef3ef]">
      <header className="flex items-center justify-between gap-2 border-b border-line bg-white/90 px-3 py-2">
        <b className="flex items-center gap-1.5 text-xs">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-teal text-[10px] text-white">🐾</span>
          {pet.name} · {room?.name ?? '定位中'} · {behaviorLabel[pet.behavior]}
        </b>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-full bg-[#e4ebe7] p-0.5" data-testid="mini-view-toggle">
            <button onClick={() => setView('3d')} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${view === '3d' ? 'bg-white text-teal shadow-softsm' : 'text-[#6f817b]'}`}>3D</button>
            <button onClick={() => setView('flat')} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${view === 'flat' ? 'bg-white text-teal shadow-softsm' : 'text-[#6f817b]'}`}>平面</button>
          </div>
          {pets.length > 1 &&
            pets.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePet(p.id)}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${p.id === activePetId ? 'border-teal bg-teal text-white' : 'border-line bg-white text-[#5d6e68]'}`}
              >
                {p.name}
              </button>
            ))}
          <button data-testid="mini-exit" aria-label="退出浮窗" className="grid h-6 w-6 place-items-center rounded-lg bg-[#eef3f0] text-[#6e7f79]" onClick={exit}>×</button>
        </div>
      </header>

      {view === '3d' && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-white/70 px-3 py-1.5" data-testid="mini-style-switch">
          <span className="text-[11px] text-muted">风格</span>
          {STYLE_OPTS.map((o) => (
            <button
              key={o.id}
              onClick={() => setStyle(o.id)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style === o.id ? 'border-teal bg-teal text-white' : 'border-line bg-white text-[#5d6e68]'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 p-2">
        {view === '3d' && room ? <Room3D room={room} pet={pet} style={style} /> : <LiveMap />}
      </div>
      <footer className="flex items-center justify-between border-t border-line bg-white/90 px-3 py-1.5 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-teal-2" /> 实时位置</span>
        <span>演示数据</span>
      </footer>
    </div>
  )
}
