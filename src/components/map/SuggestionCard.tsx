import { useState } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { roomHasDevice } from '@/lib/tracking'

/** 环境联动建议卡：进入房间读取该房间环境 → 判断 → 建议 → 用户确认 */
export function SuggestionCard() {
  const room = useStore(currentRoom)
  const rules = useStore((s) => s.rules)
  const devices = useStore((s) => s.devices)
  const turnOnAC = useStore((s) => s.turnOnAC)
  const toast = useStore((s) => s.toast)
  const [dismissed, setDismissed] = useState<string>('')

  if (!room) return null
  const env = room.environment
  const tempRule = rules.find((r) => r.trigger === 'temp_above' && r.enabled)
  const humidRule = rules.find((r) => r.trigger === 'humidity_above' && r.enabled)
  const tempHigh = tempRule && env.temperature >= (tempRule.threshold ?? 29)
  const humidHigh = humidRule && env.humidity >= (humidRule.threshold ?? 75)
  if (!tempHigh && !humidHigh) return null

  // 环境签名，环境变化后重新提示
  const sig = `${room.id}:${env.temperature}:${env.humidity}`
  if (dismissed === sig) return null

  const hasAC = roomHasDevice(devices, room.id, 'ac')

  return (
    <div
      data-testid="suggestion-card"
      className="animate-pop absolute left-10 top-10 z-[8] w-[330px] rounded-[20px] border border-[#dce6e1] bg-white/95 p-4 shadow-softsm"
    >
      <div className="text-sm font-extrabold">{room.name}所在环境需要关注</div>
      <div className="my-2 text-xs leading-relaxed text-muted">
        {room.name} {env.temperature.toFixed(1)}℃ · 湿度 {env.humidity}%
        <br />
        毛球已在此停留，建议将空调设置为 26℃ 保持舒适。
        {!hasAC && <span className="text-orange"> （该房间无空调，将调用最近房间空调）</span>}
      </div>
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            void turnOnAC(room.id)
            setDismissed(sig)
          }}
        >
          开启空调
        </button>
        <button
          className="btn"
          onClick={() => {
            toast('info', '已暂缓本次环境提醒')
            setDismissed(sig)
          }}
        >
          稍后提醒
        </button>
      </div>
    </div>
  )
}
