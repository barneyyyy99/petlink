import type { DeviceType, Room } from '@/domain/types'
import { roomBounds } from '@/domain/geometry'

export const deviceIcon: Record<DeviceType, string> = {
  camera: '📷',
  speaker: '🔊',
  smart_screen: '▣',
  feeder: '🍽',
  water: '💧',
  ac: '❄️',
  temp_humidity: '🌡',
  toy: '✦',
}

export function deviceIconOf(type: DeviceType): string {
  return deviceIcon[type] ?? '▦'
}

/** 依据房间语义类型生成家具示意（仅视觉区分空间，非精确建模） */
export function FurnitureNodes({ room }: { room: Room }) {
  const b = roomBounds(room)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const k = room.kind
  if (k === 'bedroom') {
    return (
      <>
        <rect className="furn-main" x={b.x + b.w * 0.18} y={b.y + b.h * 0.37} width={b.w * 0.48} height={b.h * 0.38} rx={18} fill="#c9d6d0" stroke="#aebfb7" strokeWidth={2} />
        <rect className="furn-soft" x={b.x + b.w * 0.22} y={b.y + b.h * 0.4} width={b.w * 0.17} height={b.h * 0.11} rx={8} fill="#e8ddd0" stroke="#cfbea9" strokeWidth={2} />
      </>
    )
  }
  if (k === 'study') {
    return (
      <>
        <rect x={b.x + b.w * 0.16} y={b.y + b.h * 0.28} width={b.w * 0.6} height={b.h * 0.18} rx={10} fill="#c9d6d0" stroke="#aebfb7" strokeWidth={2} />
        <circle cx={cx} cy={b.y + b.h * 0.68} r={Math.max(10, b.h * 0.09)} fill="#e8ddd0" stroke="#cfbea9" strokeWidth={2} />
      </>
    )
  }
  if (k === 'balcony') {
    return (
      <>
        <rect x={b.x + b.w * 0.1} y={b.y + b.h * 0.2} width={b.w * 0.8} height={b.h * 0.63} rx={10} fill="#e8ddd0" stroke="#cfbea9" strokeWidth={2} />
        <circle cx={b.x + b.w * 0.73} cy={b.y + b.h * 0.55} r={Math.max(10, b.h * 0.08)} fill="#a8c8b9" stroke="#8bb09e" strokeWidth={2} />
      </>
    )
  }
  if (k === 'dining') {
    return (
      <>
        <ellipse cx={cx} cy={cy} rx={b.w * 0.2} ry={b.h * 0.17} fill="#e8ddd0" stroke="#cfbea9" strokeWidth={2} />
        <circle cx={cx} cy={b.y + b.h * 0.24} r={Math.max(8, b.h * 0.055)} fill="#c9d6d0" stroke="#aebfb7" strokeWidth={2} />
      </>
    )
  }
  if (k === 'living') {
    return (
      <>
        <rect x={b.x + b.w * 0.14} y={b.y + b.h * 0.3} width={b.w * 0.48} height={b.h * 0.2} rx={18} fill="#c9d6d0" stroke="#aebfb7" strokeWidth={2} />
        <ellipse cx={b.x + b.w * 0.52} cy={b.y + b.h * 0.65} rx={b.w * 0.13} ry={b.h * 0.08} fill="#e8ddd0" stroke="#cfbea9" strokeWidth={2} />
      </>
    )
  }
  // custom
  return (
    <rect x={b.x + b.w * 0.28} y={b.y + b.h * 0.36} width={b.w * 0.44} height={b.h * 0.28} rx={14} fill="#c9d6d0" stroke="#aebfb7" strokeWidth={2} opacity={0.8} />
  )
}
