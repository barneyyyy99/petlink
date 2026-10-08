import { useStore } from '@/store/useStore'
import { MAP_W, MAP_H, roomBounds, roomCentroid } from '@/domain/geometry'
import { FurnitureNodes, floorColor, WALL } from './furniture'
import { DeviceGlyph } from './DeviceGlyph'
import { PetSvg } from '@/components/PetSvg'
import type { Point, PetBehavior } from '@/domain/types'

const behaviorAnim: Partial<Record<PetBehavior, string>> = {
  running: 'pet-run',
  looking: 'pet-look',
  sleeping: 'pet-sleep',
}

function poly(points: { x: number; y: number }[]) {
  return points.map((p) => `${p.x},${p.y}`).join(' ')
}

/** 在离户型中心最近、足够长的墙边上生成一个门洞 + 开门弧线 */
function doorFor(polygon: Point[]) {
  if (polygon.length < 3) return null
  const C = { x: MAP_W / 2, y: MAP_H / 2 }
  let bm: { a: Point; b: Point; m: Point; len: number } | null = null
  let bd = Infinity
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (len < 90) continue
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const d = Math.hypot(m.x - C.x, m.y - C.y)
    if (d < bd) { bd = d; bm = { a, b, m, len } }
  }
  if (!bm) return null
  const { a, b, m, len } = bm
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const half = Math.min(70, len * 0.6) / 2
  const x1 = m.x - ux * half
  const y1 = m.y - uy * half
  const x2 = m.x + ux * half
  const y2 = m.y + uy * half
  let nx = -uy
  let ny = ux
  if ((m.x + nx - C.x) ** 2 + (m.y + ny - C.y) ** 2 > (m.x - C.x) ** 2 + (m.y - C.y) ** 2) { nx = -nx; ny = -ny }
  const r = half * 2
  const arc = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x1 + nx * r} ${y1 + ny * r}`
  return { x1, y1, x2, y2, arc }
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
    <div className="relative mx-auto aspect-[5/3] max-h-full w-full overflow-hidden rounded-[28px] border border-line bg-[#fafcf9] shadow-soft">
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
          {/* 房间：地板色 + 墙体 + 门洞 + 家具 */}
          {rooms.map((r) => {
            const b = roomBounds(r)
            const active = petRoomIds.has(r.id)
            const door = doorFor(r.polygon)
            const floor = floorColor(r.kind)
            return (
              <g key={r.id}>
                {/* 墙体（底层较深描边） */}
                <polygon points={poly(r.polygon)} fill={floor} stroke="#7f9289" strokeWidth={9} strokeLinejoin="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
                {/* 地板（上层浅描边 + 可点击） */}
                <polygon
                  points={poly(r.polygon)}
                  fill={floor}
                  stroke={active ? '#8fc3b4' : WALL}
                  strokeWidth={active ? 4 : 2.5}
                  strokeLinejoin="round"
                  style={{ cursor: 'pointer', vectorEffect: 'non-scaling-stroke' }}
                  onClick={() =>
                    toast('info', `${r.name} · ${r.environment.temperature.toFixed(1)}℃ · 湿度 ${r.environment.humidity}%`)
                  }
                />
                {/* 门洞：用地板色覆盖墙体形成开口 + 开门弧线 */}
                {door && (
                  <>
                    <line x1={door.x1} y1={door.y1} x2={door.x2} y2={door.y2} stroke={floor} strokeWidth={11} strokeLinecap="butt" style={{ vectorEffect: 'non-scaling-stroke' }} />
                    <path d={door.arc} fill="none" stroke="#c3d0ca" strokeWidth={2} style={{ vectorEffect: 'non-scaling-stroke' }} />
                  </>
                )}
                <FurnitureNodes room={r} />
                <text x={b.x + 14} y={b.y + 24} fontSize={15} fontWeight={800} fill="#7c8d87" style={{ pointerEvents: 'none' }}>
                  {r.name}
                </text>
                {/* 设备点位（小度产品风格图标） */}
                {r.devices.map((did, idx) => {
                  const dev = devices.find((d) => d.id === did)
                  if (!dev) return null
                  const dx = b.x + b.w * (0.22 + (idx % 3) * 0.28)
                  const dy = b.y + b.h * (idx < 3 ? 0.2 : 0.8)
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
                      <circle r={21} fill="rgba(255,255,255,.92)" stroke="#dbe5e0" strokeWidth={1.5} />
                      <g transform="scale(0.9)" style={{ pointerEvents: 'none' }}>
                        <DeviceGlyph type={dev.type} />
                      </g>
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
          // 以地图坐标系错位，随地图缩放自适应（而非固定像素）
          const offsetUnits = (idx - (inRoom.length - 1) / 2) * 95
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
                left: `${(base.x + offsetUnits) / 10}%`,
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
