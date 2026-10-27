import { useStore } from '@/store/useStore'
import { summarizeDay, buildDiary, eventsForPet, filterByRange } from '@/lib/diary'
import { BookHeart, RefreshCw } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'

const PAST = [
  { d: '昨天', text: '「午后在窗边睡了很久，傍晚追着逗猫棒跑了好几圈，玩得很开心～」', tags: ['睡饱', '玩耍'] },
  { d: '10-18', text: '「今天胃口特别好，两顿都吃光光，还主动来蹭了你三次。」', tags: ['干饭', '粘人'] },
  { d: '10-17', text: '「下雨没出门，大部分时间在打盹，安安静静的一天。」', tags: ['安静', '休息'] },
]

export function DiaryScreen() {
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const events = useStore((s) => s.events)
  const home = useStore((s) => s.homeMap)
  const moodSignal = useStore((s) => s.moodSignal)
  const diarySeed = useStore((s) => s.diarySeed)
  const regenerateDiary = useStore((s) => s.regenerateDiary)

  const today = filterByRange(eventsForPet(events, pet.id, pets[0]?.id), 'today', Date.now())
  const diary = buildDiary(summarizeDay(today, home), moodSignal, diarySeed)

  return (
    <SubScreen title="宠物日记">
      {/* 今日 */}
      <div className="rounded-[20px] p-5 text-white" style={{ background: G.night }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-white/85"><BookHeart size={15} /> {pet.name}的今日日记</span>
          <button onClick={regenerateDiary} className="flex items-center gap-1 rounded-full border border-white/30 px-2.5 py-1 text-[11px] font-bold text-white/90"><RefreshCw size={12} /> 换一条</button>
        </div>
        <p className="mt-3 text-[15px] font-semibold leading-relaxed">“{diary}”</p>
      </div>

      {/* 历史 */}
      <div className="mb-2 mt-4 px-1 text-[13px] font-bold" style={{ color: C.ink }}>往期日记</div>
      <div className="flex flex-col gap-2.5">
        {PAST.map((p) => (
          <Card key={p.d}>
            <div className="mb-1.5 text-[12px] font-bold" style={{ color: C.primary }}>{p.d}</div>
            <p className="text-[14px] leading-relaxed" style={{ color: C.ink }}>{p.text}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {p.tags.map((t) => <span key={t} className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: C.primarySoft, color: C.primary }}>{t}</span>)}
            </div>
          </Card>
        ))}
      </div>
    </SubScreen>
  )
}
