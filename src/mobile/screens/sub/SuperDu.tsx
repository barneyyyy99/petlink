import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Send, Image, Stethoscope } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { SubScreen } from '@/mobile/nav'

type Msg = { id: string; role: 'user' | 'ai'; text: string }
const SUGGEST = ['豆豆最近吃得怎么样？', '不太爱吃饭要观察什么？', '总是挠痒是什么原因？']

// 内置养宠知识问答（Mock；接真实大模型时替换 answer()）
function answer(q: string, pet: string): string {
  if (/吃得怎么样|进食|吃饭|食欲/.test(q)) return `根据${pet}的项圈数据，今天进食 2 次、饮水 3 次，食量和昨天基本持平，属于正常范围～继续保持定时定量就好。`
  if (/不爱吃|没胃口|观察/.test(q)) return `若${pet}不爱吃饭，可观察：是否精神萎靡、有无呕吐腹泻、鼻头是否干热、饮水是否减少。偶尔一餐不吃多为挑食或天气影响；若连续 24 小时拒食或伴随其它异常，建议就医。`
  if (/挠痒|瘙痒|抓/.test(q)) return `频繁挠痒常见原因：跳蚤/螨虫、皮肤过敏、干燥或耳道感染。先检查有无红点、掉毛、耳朵异味。可先做体外驱虫；若持续或皮肤破损，建议到宠物医院做皮肤镜检查。`
  return `已连接${pet}的项圈与健康数据。你可以问我喂养、行为、健康相关的问题，我会结合它的实时数据给出建议（仅供参考，紧急情况请及时就医）。`
}

export function SuperDuScreen() {
  const pet = useStore((s) => s.pet)
  const [tab, setTab] = useState<'care' | 'vet'>('care')
  const [vetMode, setVetMode] = useState(false)
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])

  const ask = (q: string) => {
    if (!q.trim()) return
    const u: Msg = { id: 'u' + Date.now(), role: 'user', text: q }
    setMsgs((m) => [...m, u])
    setText('')
    window.setTimeout(() => setMsgs((m) => [...m, { id: 'a' + Date.now(), role: 'ai', text: answer(q, pet.name) }]), 500)
  }

  return (
    <SubScreen title="小度 · 养宠管家" right="">
      {/* 两 tab */}
      <div className="mb-3 flex rounded-full bg-[#eef2f8] p-1">
        <button onClick={() => setTab('care')} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={tab === 'care' ? { background: '#fff', color: C.primary } : { color: C.sub }}>养宠管家</button>
        <button onClick={() => setTab('vet')} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={tab === 'vet' ? { background: '#fff', color: C.primary } : { color: C.sub }}>AI 问诊</button>
      </div>

      {/* 问候卡 */}
      <div className="rounded-[18px] p-4" style={{ background: G.soft }}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-white text-lg" style={{ background: G.primary }}>🤖</span>
          <div>
            <div className="text-[12px]" style={{ color: C.sub }}>Hi ✨</div>
            <b className="text-[15px]" style={{ color: C.ink }}>我是你的<span style={{ color: C.primary }}>超能小度</span></b>
            <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: C.sub }}>已连接{pet.name}的项圈数据，养护、健康问题都能问我</p>
          </div>
        </div>
      </div>

      {/* 试问 / 对话 */}
      {msgs.length === 0 ? (
        <div className="mt-3 rounded-[18px] bg-white p-3 shadow-sm">
          <div className="mb-1 px-1 text-[12px]" style={{ color: C.sub }}>你可以试着问我</div>
          {SUGGEST.map((q) => (
            <button key={q} onClick={() => ask(q)} className="mt-2 w-full rounded-2xl bg-[#f4f7fc] px-4 py-3 text-left text-[14px]" style={{ color: C.ink }}>{q}</button>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          {msgs.map((m) => (
            <div key={m.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${m.role === 'user' ? 'self-end text-white' : 'self-start bg-white shadow-sm'}`}
              style={m.role === 'user' ? { background: C.primary } : { color: C.ink }}>
              {m.text}
            </div>
          ))}
        </div>
      )}

      {/* 底部输入 */}
      <div className="mt-4 rounded-[18px] bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => setVetMode((v) => !v)} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: vetMode ? C.primary : C.sub }}>
            <span className={`toggle ${vetMode ? 'on' : ''}`} style={{ pointerEvents: 'none' }} /> <Stethoscope size={14} /> 医生问诊
          </button>
          <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: C.primary }}><Image size={14} /> 图片/视频</span>
        </div>
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(text) }}
            placeholder={`说说${pet.name}的情况…`} className="flex-1 rounded-full bg-[#f4f7fc] px-4 py-2.5 text-[14px] outline-none" />
          <button onClick={() => ask(text)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white" style={{ background: G.primary }}><Send size={17} /></button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px]" style={{ color: C.faint }}>内容由 AI 生成，仅供参考，紧急情况请及时就医</p>
    </SubScreen>
  )
}
