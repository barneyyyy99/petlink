import { useEffect } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { LiveMap } from '@/components/map/LiveMap'
import { behaviorLabel } from '@/lib/tracking'

/** 浮窗 / 桌面组件模式：仅显示户型图与实时移动的宠物。通过 ?mini=1 进入（可用小窗打开）。 */
export function MiniWidget() {
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const activePetId = useStore((s) => s.activePetId)
  const setActivePet = useStore((s) => s.setActivePet)
  const room = useStore(currentRoom)
  const setMapMode = useStore((s) => s.setMapMode)
  const simulateNextRoom = useStore((s) => s.simulateNextRoom)

  // 浮窗固定为实时地图模式
  useEffect(() => {
    setMapMode('live')
  }, [setMapMode])

  // 环境动效：周期性让宠物在房间之间走动，使浮窗“活”起来（演示数据）
  useEffect(() => {
    const t = setInterval(() => simulateNextRoom(), 16000)
    return () => clearInterval(t)
  }, [simulateNextRoom])

  const exit = () => {
    window.close()
    // 若非弹窗打开（无法 close），回到正常应用
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
      <div className="min-h-0 flex-1 p-2">
        <LiveMap />
      </div>
      <footer className="flex items-center justify-between border-t border-line bg-white/90 px-3 py-1.5 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-teal-2" /> 实时位置</span>
        <span>演示数据</span>
      </footer>
    </div>
  )
}
