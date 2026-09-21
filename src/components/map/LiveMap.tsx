import { useStore } from '@/store/useStore'
import { MAP_W, MAP_H, roomBounds, roomCentroid } from '@/domain/geometry'
import { FurnitureNodes, deviceIconOf } from './furniture'
import { PetSvg } from '@/components/PetSvg'
import type { PetBehavior } from '@/domain/types'

const behaviorAnim: Partial<Record<PetBehavior, string>> = {
  running: 'pet-run',
  looking: 'pet-look',
  sleeping: 'pet-sleep',
}

function poly(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

export function LiveMap() {
  const rooms = useStore((s) => s.homeMap.rooms)
  const devices = useStore((s) => s.devices)
  const pets = useStore((s) => s.pets)
  const activePetId = useStore((s) => s.activePetId)
  const setActivePet = useStore((s) => s.setActivePet)
  const mapMode = useStore((s) => s.mapMode)
  const transition = useStore((s) => s.transitionRoute)
  const events = useStore((s) => s.events)
  const openModal = useStore((s) => s.openModal)
  const setDeviceControlTarget = useStore((s) => s.setDeviceControlTarget)
  const toast = useStore((s) => s.toast)

  const petRoomIds = new Set(pets.map((p) => p.roomId))
  // 历史轨迹：按 room_change 事件顺序（时间升序）取房间质心
  const historyPts =
    mapMode === 'history'
      ? [...events]
          .filter((e) => e.type === 'room_change')
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((e) => rooms.find((r) => r.id === (e.toRoomId ?? e.roomId)))
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map(roomCentroid)
      : []

  return (
    <div className="relative h-full overflow-hidden rounded-[28px] border border-line bg-[#fafcf9] shadow-soft">
      <div className="absolute inset-5 overflow-hidden rounded-[22px] border border-[#e2e9e4] bg-[#f4f7f3]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="none"
          data-testid="live-map-svg"
        >
          {/* 历史轨迹 */}
          {historyPts.length > 1 && (
            <>
              <polyline className="history-route" points={poly(historyPts)} />
              {historyPts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={17} fill="#fff" stroke="#c5793f" strokeWidth={5} />
                  <text x={p.x} y={p.y + 1} fontSize={17} fontWeight={900} fill="#a65e2f" textAnchor="middle" dominantBaseline="central">
                    {i + 1}
                  </text>
                </g>
              ))}
            </>
          )}
          {/* 过渡路径 */}
          {transition && (
            <>
              <line className="transition-route" x1={transition.from.x} y1={transition.from.y} x2={transition.to.x} y2={transition.to.y} />
              <circle cx={transition.from.x} cy={transition.from.y} r={8} fill="#fff" stroke="#2e7f75" strokeWidth={5} />
              <circle cx={transition.to.x} cy={transition.to.y} r={8} fill="#fff" stroke="#2e7f75" strokeWidth={5} />
            </>
          )}
          {/* 房间 */}
          {rooms.map((r) => {
            const b = roomBounds(r)
            return (
              <g key={r.id}>
                <polygon
                  points={poly(r.polygon)}
                  fill="rgba(255,255,255,.91)"
                  stroke={petRoomIds.has(r.id) ? '#98baae' : '#cbd7d1'}
                  strokeWidth={4}
                  style={{ cursor: 'pointer', vectorEffect: 'non-scaling-stroke' }}
                  onClick={() =>
                    toast('info', `${r.name} · ${r.environment.temperature.toFixed(1)}℃ · 湿度 ${r.environment.humidity}%`)
                  }
                />
                <FurnitureNodes room={r} />
                <text x={b.x + 16} y={b.y + 28} fontSize={18} fontWeight={800} fill="#8a9a95" style={{ pointerEvents: 'none' }}>
                  {r.name}
                </text>
                {/* 设备点位 */}
                {r.devices.map((did, idx) => {
                  const dev = devices.find((d) => d.id === did)
                  if (!dev) return null
                  const dx = b.x + b.w * (0.2 + (idx % 3) * 0.3)
                  const dy = b.y + b.h * (idx < 3 ? 0.22 : 0.78)
                  return (
                    <g
                      key={did}
                      transform={`translate(${dx} ${dy})`}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeviceControlTarget({ deviceId: did })
                      }}
                    >
                      <circle r={22} fill="white" stroke="#d7e2dd" strokeWidth={2} />
                      <text y={1} fontSize={21} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>
                        {deviceIconOf(dev.type)}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

        {/* Avatar 覆盖层：每只宠物一个（同房间自动错位），点击选中并打开详情 */}
        {pets.map((p) => {
          const r = rooms.find((rm) => rm.id === p.roomId)
          const base = r ? roomCentroid(r) : { x: MAP_W / 2, y: MAP_H / 2 }
          // 同房间内的宠物按序号横向错开
          const inRoom = pets.filter((x) => x.roomId === p.roomId)
          const idx = inRoom.findIndex((x) => x.id === p.id)
          const offset = (idx - (inRoom.length - 1) / 2) * 70
          const isActive = p.id === activePetId
          return (
            <button
              key={p.id}
              data-testid={isActive ? 'pet-avatar' : 'pet-avatar-other'}
              aria-label={`${p.name} Avatar，当前${r?.name ?? ''}`}
              onClick={() => {
                if (!isActive) {
                  setActivePet(p.id)
                  toast('info', `已切换到 ${p.name}`)
                }
                openModal('avatar')
              }}
              className={`absolute grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-[22px] border-4 bg-[#fff8e9] shadow-soft ${
                behaviorAnim[p.behavior] ?? ''
              } ${isActive ? 'border-teal-2 ring-4 ring-teal-2/20 z-[7]' : 'border-white opacity-90 z-[6]'}`}
              style={{
                left: `calc(${base.x / 10}% + ${offset}px)`,
                top: `${base.y / 6}%`,
                transform: 'translate(-50%,-50%)',
                transition: 'left .9s cubic-bezier(.22,.86,.36,1), top .9s cubic-bezier(.22,.86,.36,1)',
              }}
            >
              <PetSvg behavior={p.behavior} size={56} />
            </button>
          )
        })}
      </div>

      <div className="absolute bottom-6 left-6 z-[5] flex gap-3 rounded-2xl border border-line bg-white/90 px-3 py-2.5 text-[11px] text-muted">
        <span>● {pets.length} 只宠物实时更新</span>
        <span>点击 Avatar 切换/互动</span>
        <span>设备图标可控制</span>
      </div>
    </div>
  )
}
