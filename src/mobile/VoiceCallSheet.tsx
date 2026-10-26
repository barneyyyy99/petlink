import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Mic, Play, Plus, Check, X } from 'lucide-react'
import { C } from '@/mobile/theme'
import { useMobileUi } from '@/mobile/useMobileUi'

/** 首页"叫它"：呼唤宠物弹窗（预录短语播放 + 新增录音 + 按住实时喊话） */
export function VoiceCallSheet() {
  const open = useMobileUi((s) => s.callSheet)
  const setOpen = useMobileUi((s) => s.setCallSheet)
  const phrases = useMobileUi((s) => s.phrases)
  const addPhrase = useMobileUi((s) => s.addPhrase)
  const pet = useStore((s) => s.pet)
  const devices = useStore((s) => s.devices)
  const sendCommand = useStore((s) => s.sendCommand)
  const toast = useStore((s) => s.toast)
  const [talking, setTalking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [recording, setRecording] = useState(false)
  const secRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const speaker = devices.find((d) => d.type === 'speaker')

  if (!open) return null

  const startTalk = () => { setTalking(true) }
  const endTalk = () => { if (!talking) return; setTalking(false); sendCommand(speaker?.id ?? pet.id, '实时喊话'); toast('success', `已通过最近的小度设备喊话给${pet.name}`) }

  const startRec = () => { if (!label.trim()) return toast('warn', '先给这句话起个名字'); setRecording(true); secRef.current = 0; timerRef.current = window.setInterval(() => (secRef.current += 1), 1000) }
  const endRec = () => {
    if (!recording) return
    if (timerRef.current) window.clearInterval(timerRef.current)
    setRecording(false)
    addPhrase(label.trim())
    // TODO: 真实声线克隆 —— 上传录音到克隆服务
    toast('success', `已录入「${label.trim()}」，云端声线克隆中…`)
    setLabel(''); setAdding(false)
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
          {/* 新增录音 */}
          <button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1 rounded-full border-2 border-dashed px-3.5 py-2 text-[14px] font-bold" style={{ borderColor: C.primary, color: C.primary }}>
            <Plus size={16} /> 录新短语
          </button>
        </div>

        {/* 新增录音行 */}
        {adding && (
          <div className="mt-3 rounded-2xl bg-[#f4f7fc] p-3">
            <div className="flex items-center gap-2">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="给这句话起个名字，如：宝贝别怕" className="flex-1 rounded-full bg-white px-3.5 py-2 text-[13px] outline-none" />
              <button onClick={() => { setAdding(false); setLabel('') }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#9aa4b4]" aria-label="取消"><X size={15} /></button>
            </div>
            <button
              onPointerDown={startRec} onPointerUp={endRec} onPointerLeave={endRec}
              className="mt-2.5 flex w-full select-none items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold text-white" style={{ background: recording ? C.danger : C.primary }}
            >
              {recording ? <><Check size={16} /> 松开保存（{secRef.current}s）</> : <><Mic size={16} /> 按住录制</>}
            </button>
          </div>
        )}

        <button
          onPointerDown={startTalk} onPointerUp={endTalk} onPointerLeave={endTalk}
          className="mt-4 flex w-full select-none items-center justify-center gap-2 rounded-full py-4 text-[16px] font-bold text-white shadow-[0_8px_22px_rgba(40,199,111,.4)] transition active:scale-[.98]"
          style={{ background: talking ? '#1fae5f' : 'linear-gradient(90deg,#5BD98A,#28C76F)' }}
        >
          <Mic size={20} /> {talking ? '松开发送…' : '按住实时喊话'}
        </button>
      </div>
    </div>
  )
}
