import { useStore } from '@/store/useStore'
import { LiveMap } from '@/components/map/LiveMap'
import { TrackingCard } from '@/components/map/TrackingCard'
import { SuggestionCard } from '@/components/map/SuggestionCard'
import { CameraFloat } from '@/components/map/CameraFloat'
import { roomShare } from '@/lib/diary'
import type { MapMode } from '@/store/useStore'

const MODES: { key: MapMode; label: string }[] = [
  { key: 'live', label: '实时' },
  { key: 'history', label: '历史' },
  { key: 'devices', label: '设备' },
]

export function MapPage() {
  const mapMode = useStore((s) => s.mapMode)
  const setMapMode = useStore((s) => s.setMapMode)
  const pet = useStore((s) => s.pet)
  const openModal = useStore((s) => s.openModal)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const events = useStore((s) => s.events)
  const home = useStore((s) => s.homeMap)

  const shares = roomShare(events, home)

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[620px] flex-col gap-3.5 max-[700px]:min-h-[560px]">
      <div className="flex items-center justify-between gap-3 max-[700px]:flex-col max-[700px]:items-stretch">
        <div className="flex items-center gap-3">
          <div>
            <div className="eyebrow">REAL-TIME HOME MAP</div>
            <div className="mt-0.5 text-xl font-extrabold max-[700px]:text-lg">我的家 · {pet.name}实时地图</div>
          </div>
          <span className="badge">● 实时追踪</span>
        </div>
        <div className="flex items-center gap-2.5 max-[700px]:w-full">
          <div className="flex rounded-2xl bg-[#e4ebe7] p-1 max-[700px]:flex-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                data-testid={`map-mode-${m.key}`}
                onClick={() => {
                  setMapMode(m.key)
                  if (m.key === 'history') toggleDrawer(true)
                }}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition max-[700px]:flex-1 ${
                  mapMode === m.key ? 'bg-white text-teal shadow-softsm' : 'text-[#6f817b]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button className="btn whitespace-nowrap" data-testid="edit-map-btn" onClick={() => openModal('mapBuilder')}>
            编辑户型
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <LiveMap />
        {mapMode === 'live' && <TrackingCard />}
        {mapMode === 'live' && <SuggestionCard />}
        <CameraFloat />
        {mapMode === 'history' && (
          <div className="absolute right-6 top-6 z-[9] w-[240px] rounded-[20px] border border-[#dce6e1] bg-white/95 p-4 shadow-softsm max-[700px]:left-3 max-[700px]:right-3 max-[700px]:top-3 max-[700px]:w-auto">
            <b className="text-sm">今日停留热点</b>
            <div className="mt-3 flex flex-col gap-2.5">
              {shares.length ? (
                shares.map((s) => (
                  <div key={s.roomName} className="grid grid-cols-[52px_1fr_36px] items-center gap-2 text-xs">
                    <span className="text-muted">{s.roomName}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[#edf2ef]">
                      <i className="block h-full rounded-full bg-gradient-to-r from-orange to-[#e0a878]" style={{ width: `${s.pct}%` }} />
                    </span>
                    <b className="text-right">{s.pct}%</b>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted">今日暂无跨房间记录</div>
              )}
            </div>
            <div className="mt-3 text-[10px] leading-relaxed text-muted">
              地图上按时间顺序绘制了当日跨房间轨迹与停留节点。
            </div>
          </div>
        )}
        {mapMode === 'devices' && (
          <div className="absolute right-6 top-6 z-[9] w-[240px] rounded-[20px] border border-[#dce6e1] bg-white/95 p-4 text-xs text-muted shadow-softsm max-[700px]:left-3 max-[700px]:right-3 max-[700px]:top-3 max-[700px]:w-auto">
            设备模式：点击地图上的设备图标进入对应控制页。
          </div>
        )}
      </div>
    </div>
  )
}
