import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Mic, Play } from 'lucide-react'
import { C } from '@/mobile/theme'
import { useMobileUi } from '@/mobile/useMobileUi'

const PHRASES = ['豆豆～', '过来', '好棒', '吃饭啦', '我晚点回来']

/** 首页"叫它"：呼唤宠物弹窗（预录短语播放 + 按住实时喊话） */
export function VoiceCallSheet() {
  const open = useMobileUi((s) => s.callSheet)
  const setOpen = useMobileUi((s) => s.setCallSheet)
  const pet = useStore((s) => s.pet)
  const devices = useStore((s) => s.devices)
  const sendCommand = useStore((s) => s.sendCommand)
  const toast = useStore((s) => s.toast)
  const [talking, setTalking] = useState(false)
  const secRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const speaker = devices.find((d) => d.type === 'speaker')

  if (!open) return null

  const phrases = PHRASES.slice(0, 3)
  const startTalk = () => {
    setTalking(true); secRef.current = 0
    timerRef.current = window.setInterval(() => (secRef.current += 1), 1000)
  }
  const endTalk = () => {
    if (!talking) return
    if (timerRef.current) window.clearInterval(timerRef.current)
    setTalking(false)
    sendCommand(speaker?.id ?? pet.id, '实时喊话')
    toast('success', `已通过最近的小度设备喊话给${pet.name}`)
  }

  return (
    <div className="m-sheet absolute inset-0 z-[115] flex items-end bg-[rgba(17,25,40,.4)]" onClick={() => setOpen(false)}>
      <div className="animate-sheetup w-full rounded-t-[24px] bg-white px-5 pb-8 pt-4" onClick={(e) => e.stopPropagation()}>
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-[#e2e6ee]" />
        <h3 className="flex items-center gap-2 text-[19px] font-extrabold" style={{ color: C.ink }}>呼唤{pet.name} <Mic size={18} color={C.primary} /></h3>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.sub }}>用你预录的声音，通过附近的音箱 / 智能屏 / 项圈扬声器播放。</p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {phrases.map((p) => (
            <button key={p} onClick={() => { sendCommand(speaker?.id ?? pet.id, `播放主人声音：${p}`); toast('info', `正在播放：${p}`) }}
              className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-bold" style={{ background: C.primarySoft, color: C.primary }}>
              <Play size={14} fill={C.primary} /> {p}
            </button>
          ))}
        </div>

        <button
          onPointerDown={startTalk}
          onPointerUp={endTalk}
          onPointerLeave={endTalk}
          className="mt-4 flex w-full select-none items-center justify-center gap-2 rounded-full py-4 text-[16px] font-bold text-white shadow-[0_8px_22px_rgba(40,199,111,.4)] transition active:scale-[.98]"
          style={{ background: talking ? '#1fae5f' : 'linear-gradient(90deg,#5BD98A,#28C76F)' }}
        >
          <Mic size={20} /> {talking ? '松开发送…' : '按住实时喊话'}
        </button>
      </div>
    </div>
  )
}
