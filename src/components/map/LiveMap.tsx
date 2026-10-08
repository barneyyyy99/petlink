import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { MAP_W, MAP_H, roomBounds, roomCentroid } from '@/domain/geometry'
import { floorColor, WALL } from './furniture'
import { drawFurniture, defaultFurniture } from './furnitureLib'
import { DeviceGlyph } from './DeviceGlyph'
import { PetSvg } from '@/components/PetSvg'
import { behaviorLabel, roomDevices } from '@/lib/tracking'
import { relativeTime } from '@/lib/time'
import type { Point, PetBehavior } from '@/domain/types'

const behaviorAnim: Partial<Record<PetBehavior, string>> = {
  running: 'pet-run',
  looking: 'pet-look',
  sleeping: 'pet-sleep',
}

const behaviorColor: Record<PetBehavior, string> = {
  sleeping: '#7f93c0',
  idle: '#9aa8a3',
  looking: '#4ca092',
  running: '#2e7f75',
  eating: '#c5793f',
  drinking: '#5aa6e0',
  playing: '#d98fb0',
  litter: '#b0a06a',
}
const behaviorBadge: Record<PetBehavior, string> = {
  sleeping: '💤',
  idle: '●',
  looking: '👀',
  running: '🐾',
  eating: '🍽',
  drinking: '💧',
  playing: '🧶',
  litter: '◫',
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

type Win = { x1: number; y1: number; x2: number; y2: number }
/** 外墙上的窗户段：找到位于户型外轮廓上的房间边，取中段作为窗 */
function windowsFor(rooms: { polygon: Point[] }[]): Win[] {
  const all = rooms.flatMap((r) => r.polygon)
  if (!all.length) return []
  const minX = Math.min(...all.map((p) => p.x))
  const maxX = Math.max(...all.map((p) => p.x))
  const minY = Math.min(...all.map((p) => p.y))
  const maxY = Math.max(...all.map((p) => p.y))
  const eps = 2
  const out: Win[] = []
  for (const r of rooms) {
    for (let i = 0; i < r.polygon.length; i++) {
      const a = r.polygon[i]
      const b = r.polygon[(i + 1) % r.polygon.length]
      const onV = (Math.abs(a.x - minX) < eps && Math.abs(b.x - minX) < eps) || (Math.abs(a.x - maxX) < eps && Math.abs(b.x - maxX) < eps)
      const onH = (Math.abs(a.y - minY) < eps && Math.abs(b.y - minY) < eps) || (Math.abs(a.y - maxY) < eps && Math.abs(b.y - maxY) < eps)
      if (!onV && !onH) continue
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      if (len < 150) continue
      const ux = (b.x - a.x) / len
      const uy = (b.y - a.y) / len
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const half = Math.min(100, len * 0.4) / 2
      out.push({ x1: m.x - ux * half, y1: m.y - uy * half, x2: m.x + ux * half, y2: m.y + uy * half })
    }
  }
  return out
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
  const openCamera = useStore((s) => s.openCamera)
  const sendCommand = useStore((s) => s.sendCommand)
  const toast = useStore((s) => s.toast)
  const [popover, setPopover] = useState<string | null>(null)

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
                {/* 家具（来自可编辑数据，缺省回退按房型生成） */}
                {(r.furniture ?? defaultFurniture(r)).map((f) => (
                  <g key={f.id} transform={`translate(${f.x} ${f.y}) rotate(${f.rotation ?? 0} ${f.w / 2} ${f.h / 2})`} style={{ pointerEvents: 'none' }}>
                    {drawFurniture(f.type, f.w, f.h)}
                  </g>
                ))}
                <text x={b.x + 14} y={b.y + 24} fontSize={15} fontWeight={800} fill="#7c8d87" style={{ pointerEvents: 'none' }}>
                  {r.name}
                </text>
                {/* 设备点位（小度产品风格图标 + 名称） */}
                {r.devices.map((did, idx) => {
                  const dev = devices.find((d) => d.id === did)
                  if (!dev) return null
                  const dx = b.x + b.w * (0.22 + (idx % 3) * 0.28)
                  const dy = b.y + b.h * (idx < 3 ? 0.22 : 0.8)
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
                      <circle r={24} fill="rgba(255,255,255,.95)" stroke="#cfe0d8" strokeWidth={2} />
                      <g style={{ pointerEvents: 'none' }}>
                        <DeviceGlyph type={dev.type} />
                      </g>
                      <text y={40} fontSize={11} fontWeight={700} textAnchor="middle" fill="#5d726a" style={{ pointerEvents: 'none' }}>
                        {dev.name.replace(/^(客厅|卧室|书房|阳台|餐厅)/, '')}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })}
          {/* 外墙窗户 */}
          {windowsFor(rooms).map((w, i) => (
            <g key={`win${i}`}>
              <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#dfeaf2" strokeWidth={10} strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
              <line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#8fb6d6" strokeWidth={3} strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} strokeDasharray="2 10" />
            </g>
          ))}
          {/* 过渡路径 + 脚印（画在家具之上，确保可见） */}
          {transition && (
            <>
              <line className="transition-route" x1={transition.from.x} y1={transition.from.y} x2={transition.to.x} y2={transition.to.y} />
              {[0.3, 0.5, 0.7].map((t, i) => (
                <circle key={i} cx={transition.from.x + (transition.to.x - transition.from.x) * t} cy={transition.from.y + (transition.to.y - transition.from.y) * t} r={6} fill="#4ca092" opacity={0.5 + i * 0.15} />
              ))}
              <circle cx={transition.to.x} cy={transition.to.y} r={9} fill="#fff" stroke="#2e7f75" strokeWidth={5} />
            </>
          )}
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
          const color = behaviorColor[p.behavior]
          const leftPct = (base.x + offsetUnits) / 10
          const topPct = base.y / 6
          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: 'translate(-50%,-50%)',
                transition: 'left .9s cubic-bezier(.22,.86,.36,1), top .9s cubic-bezier(.22,.86,.36,1)',
                zIndex: isActive ? 8 : 6,
              }}
            >
              <button
                data-testid={isActive ? 'pet-avatar' : 'pet-avatar-other'}
                aria-label={`${p.name} Avatar，当前${r?.name ?? ''}·${behaviorLabel[p.behavior]}`}
                title={`${p.name} · ${r?.name ?? ''} · ${behaviorLabel[p.behavior]}`}
                onClick={() => {
                  if (!isActive) {
                    setActivePet(p.id)
                    setPopover(p.id)
                  } else {
                    setPopover((v) => (v === p.id ? null : p.id))
                  }
                }}
                className={`relative grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-[22px] border-4 bg-[#fff8e9] ${behaviorAnim[p.behavior] ?? ''} ${isActive ? '' : 'opacity-90'}`}
                style={{
                  borderColor: isActive ? color : '#ffffff',
                  boxShadow: isActive ? `0 0 0 6px ${color}22, 0 16px 26px rgba(53,86,77,.19)` : '0 10px 20px rgba(53,86,77,.14)',
                }}
              >
                <PetSvg behavior={p.behavior} size={56} />
              </button>
              {/* 行为徽标（图标，默认不显文字，符合低文字原则） */}
              <span
                className="pointer-events-none absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-white text-[12px] shadow"
                style={{ boxShadow: `0 0 0 2px ${color}` }}
                aria-hidden
              >
                {behaviorBadge[p.behavior]}
              </span>
            </div>
          )
        })}

        {/* Avatar 快捷互动气泡（核心交互：点一下即可看它/叫它/陪它） */}
        {(() => {
          const p = pets.find((x) => x.id === popover)
          if (!p || p.id !== activePetId) return null
          const r = rooms.find((rm) => rm.id === p.roomId)
          const base = r ? roomCentroid(r) : { x: MAP_W / 2, y: MAP_H / 2 }
          const leftPct = Math.max(16, Math.min(84, base.x / 10))
          const topPct = base.y / 6
          const roomDevs = r ? roomDevices(devices, r.id) : []
          const speaker = roomDevs.find((d) => d.type === 'speaker')
          const feeder = devices.find((d) => d.type === 'feeder')
          const actions: { label: string; onClick: () => void }[] = [
            { label: '👁 看看它', onClick: () => openCamera() },
            { label: '🔊 叫它', onClick: () => sendCommand(speaker?.id ?? p.id, `呼叫${p.name}`) },
            { label: '🎙 主人声音', onClick: () => sendCommand(speaker?.id ?? p.id, '播放主人声音') },
            { label: '🎬 视频互动', onClick: () => openCamera(true) },
            { label: '🍽 投喂', onClick: () => sendCommand(feeder?.id ?? p.id, '远程投喂 8g') },
            { label: '✦ 逗宠', onClick: () => sendCommand(p.id, '启动逗宠模组') },
          ]
          return (
            <div
              data-testid="avatar-popover"
              className="animate-pop absolute z-[12] w-[260px] -translate-x-1/2 rounded-2xl border border-[#dce6e1] bg-white/97 p-3.5 shadow-soft backdrop-blur"
              style={{ left: `${leftPct}%`, top: `calc(${topPct}% - 56px)`, transform: 'translate(-50%,-100%)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <b className="text-base">{p.name}</b>
                  <div className="mt-0.5 text-xs text-muted">{r?.name} · {behaviorLabel[p.behavior]} · {relativeTime(p.lastUpdatedAt)}</div>
                </div>
                <button className="grid h-6 w-6 place-items-center rounded-lg bg-[#eef3f0] text-[#6e7f79]" onClick={() => setPopover(null)} aria-label="关闭">×</button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-teal">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: behaviorColor[p.behavior] }} />
                定位置信度 {Math.round(p.confidence * 100)}% · {p.trackingSources.includes('camera') ? '视觉 + BLE' : 'BLE / IMU'}
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {actions.map((a) => (
                  <button key={a.label} className="rounded-xl border border-line bg-white px-1 py-2 text-[11px] font-bold text-[#53645e] hover:border-[#cde3dc] hover:bg-teal-soft hover:text-teal" onClick={a.onClick}>
                    {a.label}
                  </button>
                ))}
              </div>
              <button className="mt-2 w-full rounded-xl bg-teal-soft py-1.5 text-[11px] font-bold text-teal" onClick={() => { setPopover(null); openModal('avatar') }}>
                更多详情 / 管理宠物
              </button>
            </div>
          )
        })()}
      </div>

      <div className="absolute bottom-6 left-6 z-[5] flex gap-3 rounded-2xl border border-line bg-white/90 px-3 py-2.5 text-[11px] text-muted">
        <span>● {pets.length} 只宠物实时更新</span>
        <span>点击 Avatar 看它/叫它/陪它</span>
        <span>设备图标可控制</span>
      </div>
    </div>
  )
}
