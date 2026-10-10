import { useEffect } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { useAuth } from '@/store/useAuth'
import { Room3D } from '@/components/map/Room3D'
import { CameraFloat } from '@/components/map/CameraFloat'

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
  const setWidgetMode = useStore((s) => s.setWidgetMode)
  const goPage = useStore((s) => s.goPage)
  const openCameraFloat = useStore((s) => s.openCameraFloat)
  const cloudUser = useAuth((s) => s.user)

  useEffect(() => {
    setMapMode('live')
  }, [setMapMode])

  // 自动溜达：仅在未登录云同步时演示；登录后位置以云端真实/同步数据为准，避免多设备互相覆盖乱跳
  useEffect(() => {
    if (cloudUser) return
    const t = setInterval(() => simulateNextRoom(), 16000)
    return () => clearInterval(t)
  }, [simulateNextRoom, cloudUser])

  // 展开为完整应用：退出组件视图并进入完整地图（Electron 下同时放大窗口）
  const expand = () => {
    setWidgetMode(false)
    goPage('map')
    const desktop = (window as unknown as { petlinkDesktop?: { expand?: () => void } }).petlinkDesktop
    desktop?.expand?.()
  }

  // 关闭：Electron 独立组件窗口 → 关窗；脚本打开的浮窗 → 关窗；主窗口内切换过来的 → 退回完整应用（不关整个软件）
  const exit = () => {
    const desktop = (window as unknown as { petlinkDesktop?: { close: () => void } }).petlinkDesktop
    if (desktop?.close) {
      desktop.close()
      return
    }
    if (window.opener) {
      window.close()
      return
    }
    setWidgetMode(false)
  }

  return (
    <div className="group app-drag relative h-screen w-screen overflow-hidden bg-transparent" data-testid="mini-widget">
      {room && (
        <div className="absolute inset-0" data-testid="mini-3d-room">
          <Room3D room={room} pet={pet} style="cartoon" transparent showLabel={false} />
        </div>
      )}
      {/* 悬停才出现的控制：看摄像头 / 展开完整应用 / 关闭。静止时只有 3D 房间与宠物 */}
      <div className="app-no-drag absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
        <button
          data-testid="mini-camera"
          aria-label="查看当前房间摄像头画面"
          title="看当前房间摄像头"
          onClick={() => openCameraFloat()}
          className="grid h-6 w-6 place-items-center rounded-full bg-black/35 text-[13px] text-white hover:bg-black/55"
        >
          📷
        </button>
        <button
          data-testid="mini-expand"
          aria-label="展开完整应用"
          title="切换到完整应用"
          onClick={expand}
          className="grid h-6 w-6 place-items-center rounded-full bg-black/35 text-white hover:bg-black/55"
        >
          ⤢
        </button>
        <button
          data-testid="mini-exit"
          aria-label="关闭桌面组件"
          onClick={exit}
          className="grid h-6 w-6 place-items-center rounded-full bg-black/35 text-white hover:bg-black/55"
        >
          ×
        </button>
      </div>

      {/* 摄像头观看浮窗（复用地图同款组件，直接看对应房间画面） */}
      <CameraFloat />
    </div>
  )
}
