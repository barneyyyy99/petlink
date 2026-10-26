import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { Send, Image, Stethoscope } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { SubScreen } from '@/mobile/nav'
import { reply, type Intent } from '@/mobile/vetChat'

type Msg = { id: string; role: 'user' | 'ai'; text: string; intent?: Intent }
const SUGGEST_CARE = ['豆豆最近吃得怎么样？', '每天运动多少比较合适？', '掉毛厉害怎么护理？']
const SUGGEST_VET = ['不太爱吃饭要观察什么？', '总是挠痒是什么原因？', '呕吐了需要就医吗？']

export function SuperDuScreen() {
  const pet = useStore((s) => s.pet)
  const [tab, setTab] = useState<'care' | 'vet'>('care')
  const [vetMode, setVetMode] = useState(false)
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const forced: Intent | null = tab === 'vet' || vetMode ? 'vet' : null
  const suggest = tab === 'vet' || vetMode ? SUGGEST_VET : SUGGEST_CARE

  const ask = (q: string) => {
    if (!q.trim()) return
    setMsgs((m) => [...m, { id: 'u' + Date.now(), role: 'user', text: q }])
    setText(''); setTyping(true)
    reply(q, forced, pet.name).then(({ intent, text }) => {
      setTyping(false)
      setMsgs((m) => [...m, { id: 'a' + Date.now(), role: 'ai', text, intent }])
    })
  }

  return (
    <SubScreen title="小度 · 养宠管家" fill>
      {/* 顶部：两 tab */}
      <div className="shrink-0 px-4 pb-2">
        <div className="flex rounded-full bg-[#eef2f8] p-1">
          <button onClick={() => setTab('care')} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={tab === 'care' ? { background: '#fff', color: C.primary } : { color: C.sub }}>养宠管家</button>
          <button onClick={() => setTab('vet')} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={tab === 'vet' ? { background: '#fff', color: C.primary } : { color: C.sub }}>AI 问诊</button>
        </div>
      </div>

      {/* 消息区（滚动） */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4">
        <div className="rounded-[18px] p-4" style={{ background: G.soft }}>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-lg text-white" style={{ background: G.primary }}>🤖</span>
            <div>
              <div className="text-[12px]" style={{ color: C.sub }}>Hi ✨</div>
              <b className="text-[15px]" style={{ color: C.ink }}>我是你的<span style={{ color: C.primary }}>超能小度</span></b>
              <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: C.sub }}>已连接{pet.name}的项圈数据，{tab === 'vet' || vetMode ? '健康/问诊' : '养护'}问题都能问我</p>
            </div>
          </div>
        </div>

        {msgs.length === 0 ? (
          <div className="mt-3 rounded-[18px] bg-white p-3 shadow-sm">
            <div className="mb-1 px-1 text-[12px]" style={{ color: C.sub }}>你可以试着问我</div>
            {suggest.map((q) => (
              <button key={q} onClick={() => ask(q)} className="mt-2 w-full rounded-2xl bg-[#f4f7fc] px-4 py-3 text-left text-[14px]" style={{ color: C.ink }}>{q}</button>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {msgs.map((m) => (
              <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                {m.role === 'ai' && m.intent && (
                  <span className="mb-1 ml-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: m.intent === 'vet' ? '#fff1e6' : C.primarySoft, color: m.intent === 'vet' ? C.orange : C.primary }}>
                    {m.intent === 'vet' ? '问诊建议' : '养护建议'}
                  </span>
                )}
                <div className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${m.role === 'user' ? 'text-white' : 'bg-white shadow-sm'}`}
                  style={m.role === 'user' ? { background: C.primary } : { color: C.ink }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && <div className="self-start rounded-2xl bg-white px-3.5 py-2.5 text-[14px] shadow-sm" style={{ color: C.sub }}>小度正在思考…</div>}
          </div>
        )}
        <div ref={endRef} className="h-2" />
      </div>

      {/* 底部输入（吸底） */}
      <div className="shrink-0 border-t border-[#eef1f6] bg-white px-4 pb-6 pt-2.5">
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
        <p className="mt-2 text-center text-[11px]" style={{ color: C.faint }}>内容由 AI 生成，仅供参考，紧急情况请及时就医</p>
      </div>
    </SubScreen>
  )
}
