import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Mic, Play, Trash2, Square } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'

type Phrase = { id: string; label: string; dur: number; cloned: boolean }
const SEED: Phrase[] = [
  { id: 'p1', label: '豆豆～', dur: 2, cloned: true },
  { id: 'p2', label: '过来', dur: 1, cloned: true },
  { id: 'p3', label: '好棒', dur: 1, cloned: true },
  { id: 'p4', label: '吃饭啦', dur: 2, cloned: true },
  { id: 'p5', label: '我晚点回来', dur: 3, cloned: false },
]

export function VoiceLibScreen() {
  const pet = useStore((s) => s.pet)
  const devices = useStore((s) => s.devices)
  const sendCommand = useStore((s) => s.sendCommand)
  const toast = useStore((s) => s.toast)
  const [list, setList] = useState<Phrase[]>(SEED)
  const [label, setLabel] = useState('')
  const [recording, setRecording] = useState(false)
  const [sec, setSec] = useState(0)
  const speaker = devices.find((d) => d.type === 'speaker')

  const startRec = () => {
    if (!label.trim()) return toast('warn', '先给这句话起个名字')
    setRecording(true); setSec(0)
    const t = window.setInterval(() => setSec((s) => s + 1), 1000)
    ;(startRec as any)._t = t
  }
  const stopRec = () => {
    window.clearInterval((startRec as any)._t)
    setRecording(false)
    const p: Phrase = { id: 'p' + Date.now(), label: label.trim(), dur: Math.max(1, sec), cloned: false }
    setList((l) => [p, ...l]); setLabel(''); setSec(0)
    toast('success', '已录入声音库，正在云端声线克隆…')
    // TODO: 真实声线克隆 —— 上传录音到克隆服务，完成后将 cloned 置 true
    window.setTimeout(() => setList((l) => l.map((x) => (x.id === p.id ? { ...x, cloned: true } : x))), 1800)
  }

  return (
    <SubScreen title="主人声音库">
      <p className="px-1 text-[13px]" style={{ color: C.sub }}>预录你的声音，通过项圈、音箱、小度智能屏随时为{pet.name}播放，远程也有你的陪伴 🧡</p>

      {/* 录制 */}
      <Card className="mt-3 !p-5">
        <div className="flex flex-col items-center gap-3">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="输入短语，如：宝贝别怕" className="w-full rounded-full bg-[#f4f7fc] px-4 py-2.5 text-center text-[14px] outline-none" />
          <button onClick={recording ? stopRec : startRec} className="grid h-20 w-20 place-items-center rounded-full text-white shadow-lg active:scale-95" style={{ background: recording ? C.danger : G.primary }}>
            {recording ? <Square size={28} /> : <Mic size={30} />}
          </button>
          <span className="text-[13px] font-semibold" style={{ color: recording ? C.danger : C.sub }}>
            {recording ? `录音中 ${sec}s · 点击停止` : '按一下开始录制'}
          </span>
        </div>
      </Card>

      {/* 已录短语 */}
      <div className="mb-2 mt-5 px-1 text-[14px] font-bold" style={{ color: C.ink }}>已录短语 · {list.length}</div>
      <div className="flex flex-col gap-2">
        {list.map((p) => (
          <Card key={p.id} className="!p-3">
            <div className="flex items-center gap-3">
              <button onClick={() => sendCommand(speaker?.id ?? pet.id, `播放主人声音：${p.label}`)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white" style={{ background: C.primary }}><Play size={16} /></button>
              <div className="min-w-0 flex-1">
                <b className="block text-[14px]" style={{ color: C.ink }}>{p.label}</b>
                <span className="text-[11px]" style={{ color: p.cloned ? C.green : C.orange }}>{p.cloned ? `已克隆 · ${p.dur}s` : '声线克隆中…'}</span>
              </div>
              <button onClick={() => setList((l) => l.filter((x) => x.id !== p.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4f7fc]" aria-label="删除"><Trash2 size={15} color={C.sub} /></button>
            </div>
          </Card>
        ))}
      </div>
    </SubScreen>
  )
}
