import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useStore, currentRoom, deviceById } from '@/store/useStore'
import { behaviorLabel } from '@/lib/tracking'
import { relativeTime } from '@/lib/time'

export function TrackingCard() {
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const activePetId = useStore((s) => s.activePetId)
  const setActivePet = useStore((s) => s.setActivePet)
  const room = useStore(currentRoom)
  const [collapsed, setCollapsed] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragOff = useRef<{ dx: number; dy: number } | null>(null)
  const handoff = useStore((s) => s.handoff)
  const activeCameraId = useStore((s) => s.activeCameraId)
  const cam = useStore((s) => deviceById(s, activeCameraId))
  const refreshTracking = useStore((s) => s.refreshTracking)
  const simulateNextRoom = useStore((s) => s.simulateNextRoom)

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return // 不与按钮冲突
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    dragOff.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    const onMove = (ev: PointerEvent) => {
      const parent = card.offsetParent as HTMLElement | null
      if (!parent || !dragOff.current) return
      const pr = parent.getBoundingClientRect()
      const x = Math.max(8, Math.min(pr.width - card.offsetWidth - 8, ev.clientX - pr.left - dragOff.current.dx))
      const y = Math.max(8, Math.min(pr.height - 44, ev.clientY - pr.top - dragOff.current.dy))
      setPos({ x, y })
    }
    const onUp = () => {
      dragOff.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // 让“最后更新时间”文字随时间刷新
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 3000)
    return () => clearInterval(t)
  }, [])

  const srcLabel = pet.trackingSources.includes('camera')
    ? '视觉 + BLE'
    : pet.trackingSources.includes('imu')
    ? 'BLE + IMU'
    : 'BLE'

  const chain =
    handoff.phase !== 'idle'
      ? handoff.message
      : cam
      ? `${cam.name}持续识别 · ${room?.environment.temperature.toFixed(1)}℃ / 湿度 ${room?.environment.humidity}%`
      : `项圈 BLE 持续定位 · 当前房间暂无摄像头`

  return (
    <div
      ref={cardRef}
      data-testid="tracking-card"
      className={`absolute z-[9] w-[300px] rounded-[20px] border border-[#dce6e1] bg-white/95 p-4 shadow-softsm backdrop-blur max-[700px]:w-auto ${
        pos ? '' : 'right-6 top-6 max-[700px]:inset-x-3 max-[700px]:bottom-3 max-[700px]:top-auto'
      }`}
      style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
    >
      <div className="mb-2.5 flex cursor-move items-center justify-between" onPointerDown={startDrag} title="拖动可移动">
        <b className="flex items-center gap-1 text-sm"><GripVertical size={14} className="text-[#b4c3bc]" />实时追踪</b>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-teal">
            <i className="h-2 w-2 rounded-full bg-teal-2 shadow-[0_0_0_5px_rgba(76,160,146,.12)]" /> LIVE
          </span>
          <button
            data-testid="tracking-collapse"
            aria-label={collapsed ? '展开' : '收起'}
            className="grid h-6 w-6 place-items-center rounded-lg text-[#8aa39b] hover:bg-[#eef3f0]"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {pets.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5" data-testid="pet-switcher">
          {pets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePet(p.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                p.id === activePetId ? 'border-teal bg-teal text-white' : 'border-line bg-white text-[#5d6e68]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted">{pet.name}当前在</div>
          <div data-testid="tracking-room" className="text-2xl font-extrabold tracking-tight">
            {room?.name ?? '定位中'}
          </div>
        </div>
        <div className="text-right text-[11px] text-muted">
          {behaviorLabel[pet.behavior]}
          <br />
          {relativeTime(pet.lastUpdatedAt)}
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            <Cell b={`${Math.round(pet.confidence * 100)}%`} s="定位置信度" />
            <Cell b={cam?.name ?? '无可用摄像头'} s="当前接力画面" />
            <Cell b={srcLabel} s="定位来源" />
          </div>
          <div className="mt-2.5 rounded-xl border border-dashed border-[#c9d9d2] px-2.5 py-2 text-[11px] leading-relaxed text-[#5d726a]">
            {chain}
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <button className="btn flex-1" onClick={refreshTracking}>
              刷新定位
            </button>
            <button data-testid="sim-next-room" className="btn btn-primary flex-1" onClick={simulateNextRoom}>
              模拟跨房间
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Cell({ b, s }: { b: string; s: string }) {
  return (
    <div className="rounded-xl bg-[#f2f7f4] px-2.5 py-2">
      <b className="block truncate text-[11px]">{b}</b>
      <span className="text-[12px] text-muted">{s}</span>
    </div>
  )
}
