import { useEffect } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { Room3D } from '@/components/map/Room3D'

/**
 * 桌面组件 / 浮窗模式（?mini=1 进入）：
 * 只渲染当前宠物所处房间的 3D 立体卡通形象 + 宠物，背景透明、无边框、无任何浏览器式 chrome。
 * 整个表面可拖拽（Electron 无边框窗口），关闭按钮仅在悬停时淡入。
 */
export function MiniWidget() {
  const pet = useStore((s) => s.pet)
  const room = useStore(currentRoom)
  const setMapMode = useStore((s) => s.setMapMode)
  const simulateNextRoom = useStore((s) => s.simulateNextRoom)

  useEffect(() => {
    setMapMode('live')
  }, [setMapMode])

  // 让宠物周期性在房间之间走动，组件内实时呈现
  useEffect(() => {
    const t = setInterval(() => simulateNextRoom(), 16000)
    return () => clearInterval(t)
  }, [simulateNextRoom])

  const exit = () => {
    const desktop = (window as unknown as { petlinkDesktop?: { close: () => void } }).petlinkDesktop
    if (desktop?.close) {
      desktop.close()
      return
    }
    window.close()
    window.location.href = window.location.pathname
  }

  return (
    <div className="group app-drag relative h-screen w-screen overflow-hidden bg-transparent" data-testid="mini-widget">
      {room && (
        <div className="absolute inset-0" data-testid="mini-3d-room">
          <Room3D room={room} pet={pet} style="cartoon" transparent showLabel={false} />
        </div>
      )}
      {/* 关闭按钮：静止时完全透明，仅悬停淡入，保证"只有 3D 地图与宠物" */}
      <button
        data-testid="mini-exit"
        aria-label="关闭桌面组件"
        onClick={exit}
        className="app-no-drag absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/35 text-white opacity-0 transition hover:bg-black/55 group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  )
}
