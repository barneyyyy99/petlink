import { useStore } from '@/store/useStore'
import { summarizeDay, buildDiary, eventsForPet } from '@/lib/diary'

export function RecordsPage() {
  const openModal = useStore((s) => s.openModal)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const events = useStore((s) => s.events)
  const home = useStore((s) => s.homeMap)
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const diarySeed = useStore((s) => s.diarySeed)
  const moodSignal = useStore((s) => s.moodSignal)
  const companionEnabled = useStore((s) => s.companionEnabled)
  const setCompanionEnabled = useStore((s) => s.setCompanionEnabled)
  const triggerLowMood = useStore((s) => s.triggerLowMood)
  const regenerateDiary = useStore((s) => s.regenerateDiary)
  const openCamera = useStore((s) => s.openCamera)
  const toast = useStore((s) => s.toast)

  const petEvents = eventsForPet(events, pet.id, pets[0]?.id)
  const sum = summarizeDay(petEvents, home)
  const diary = buildDiary(sum, moodSignal, diarySeed)

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="eyebrow">DAILY MEMORY</div>
          <h2 className="my-1 text-3xl font-extrabold">记录</h2>
          <div className="text-sm text-muted">轨迹、行为、声音与陪伴事件汇总在这里。</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1">
        <RecordCard ico="⌁" title="历史行踪" desc="查看房间迁移、停留热点与对应时刻影像。" onClick={() => toggleDrawer(true)} />
        <RecordCard ico="🐾" title="动作识别" desc="睡觉、进食、喝水、玩耍、跑动等行为统计。" onClick={() => openModal('action')} />
        <RecordCard ico="〽" title="声音识别" desc="叫声、呼噜等声音事件与片段记录。" onClick={() => openModal('sound')} />
      </div>

      <div className="mt-5 grid grid-cols-[1.1fr_.9fr] gap-5 max-[900px]:grid-cols-1">
        <div className="card">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">今日行为构成</h3><span className="badge">客观数据</span></div>
          <p className="mb-3 text-[11px] text-muted">以下为来自事件流的客观统计（非 AI 文案）。</p>
          {[
            { l: '跨房间', v: sum.roomChanges, w: Math.min(100, sum.roomChanges * 20) },
            { l: '进食', v: sum.eats, w: Math.min(100, sum.eats * 30) },
            { l: '喝水', v: sum.drinks, w: Math.min(100, sum.drinks * 30) },
            { l: '玩耍', v: sum.plays, w: Math.min(100, sum.plays * 30) },
            { l: '远程陪伴', v: sum.ownerInteractions, w: Math.min(100, sum.ownerInteractions * 30) },
          ].map((b) => (
            <div key={b.l} className="mb-3 grid grid-cols-[70px_1fr_52px] items-center gap-2.5 text-xs">
              <span>{b.l}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-[#edf2ef]"><i className="block h-full rounded-full bg-gradient-to-r from-teal-2 to-[#7db7aa]" style={{ width: `${b.w}%` }} /></span>
              <b>{b.v} 次</b>
            </div>
          ))}
        </div>

        <div className="rounded-[26px] border border-[#e2e9e4] bg-gradient-to-br from-[#f0f8f4] to-[#fffaf4] p-6 shadow-softsm">
          <div className="flex items-center justify-between gap-2">
            <span className="badge">{pet.name}的今天 · AI 拟人</span>
            <span className="badge badge-warn">情绪陪伴</span>
          </div>
          <div data-testid="diary-text" className="my-4 text-lg font-bold leading-relaxed tracking-tight">“{diary}”</div>
          <small className="text-muted">↑ AI 第一人称文案，依据{pet.name}今日真实事件生成（非客观结论）。以下为客观陪伴线索与设置。</small>

          <div data-testid="emotion-signal" className={`mt-3.5 rounded-2xl border p-3 text-[11px] leading-relaxed ${moodSignal ? 'border-[#f2dcc5] bg-[#fff2e4] text-[#8b623f]' : 'border-[#e0e8e4] bg-[#f3f7f5] text-[#61736d]'}`}>
            <b>主人陪伴线索：{moodSignal ? '触发一条温和提醒' : '暂无提醒'}</b>
            <br />
            {moodSignal
              ? '在你已开启功能的前提下，今天与小度的主动语音互动出现“语气较平时偏低”的弱信号，同时外出活动较少。仅用于生成陪伴建议，不作健康判断。'
              : '只有在你主动开启“情绪陪伴”后，系统才会结合与小度的轻量互动线索生成陪伴提醒，不作任何健康或心理判断。'}
          </div>

          {moodSignal && (
            <div data-testid="emotion-push" className="animate-pop mt-2.5 rounded-2xl border border-[#e4eae6] bg-white p-3.5 shadow-softsm">
              <div className="text-[9px] uppercase tracking-wide text-muted">APP PUSH · 来自{pet.name}</div>
              <b className="my-1.5 block text-sm">“今天听起来你有点没精神。”</b>
              <p className="m-0 mb-2.5 text-[11px] leading-relaxed text-[#6c7d77]">带我出去走走吧？我今天也想多活动一会儿 🐾</p>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => openCamera()}>先看看{pet.name}</button>
                <button className="btn" onClick={() => toast('success', '已加入今晚散步提醒')}>今晚去散步</button>
              </div>
            </div>
          )}

          <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-white/70 p-2.5">
            <span className="text-[11px] text-muted">开启情绪陪伴（需主动授权）</span>
            <button data-testid="companion-toggle" className={`toggle ${companionEnabled ? 'on' : ''}`} aria-label="情绪陪伴开关" onClick={() => setCompanionEnabled(!companionEnabled)} />
          </div>
          <div className="mt-2.5 flex gap-2">
            <button className="btn btn-primary" onClick={regenerateDiary}>换一条 AI 日记</button>
            <button data-testid="low-mood-btn" className="btn" disabled={!companionEnabled} onClick={triggerLowMood}>模拟主人情绪偏低</button>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-[#96a39f]">此处展示“陪伴线索”而非诊断或心理结论；提醒可关闭，并由用户主动授权。</p>
        </div>
      </div>

      <div className="card mt-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">关键事件</h3><button className="text-xs font-bold text-teal" onClick={() => toggleDrawer(true)}>在踪迹栏查看</button></div>
        <div className="grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1">
          {petEvents.slice(0, 3).map((e) => (
            <div key={e.id} className="rounded-2xl border border-line bg-white p-4"><span className="badge">{new Date(e.timestamp).toTimeString().slice(0, 5)}</span><h4 className="my-2 text-base font-bold">{e.title}</h4><p className="m-0 text-xs text-muted">{e.detail}</p></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecordCard({ ico, title, desc, onClick }: { ico: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button className="rounded-2xl border border-line bg-white p-4 text-left shadow-softsm transition hover:-translate-y-0.5" onClick={onClick}>
      <div className="text-2xl">{ico}</div>
      <h4 className="my-2 text-base font-bold">{title}</h4>
      <p className="m-0 text-xs leading-relaxed text-muted">{desc}</p>
    </button>
  )
}
