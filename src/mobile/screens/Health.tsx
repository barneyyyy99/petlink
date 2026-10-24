import { useStore } from '@/store/useStore'
import { Activity, BookHeart, Brain, Flame, Footprints, Moon } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card, SectionHeader } from '@/mobile/MobileShell'

const BEH = [
  { v: '15m', l: '嗅闻' }, { v: '19m', l: '进食' }, { v: '18s', l: '打滚' }, { v: '3m', l: '逗猫' }, { v: '14m', l: '舔毛' },
]
const REST = [
  { l: '深度睡眠', v: '8h7m' }, { l: '浅睡', v: '4h57m' }, { l: '休息', v: '7h36m' },
]
const QUALITY = [
  { l: '睡眠质量', e: '😊', s: '优秀' }, { l: '休息状态', e: '😊', s: '优秀' }, { l: '进食规律', e: '😊', s: '优秀' },
]

export function Health() {
  const pet = useStore((s) => s.pet)
  const toast = useStore((s) => s.toast)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const openModal = useStore((s) => s.openModal)

  const summary = [
    { icon: Activity, title: '运动', sub: '2,480 步', on: () => openModal('action') },
    { icon: BookHeart, title: 'AI 宠物日记', sub: '今日已更新', on: () => openModal('chat') },
    { icon: Brain, title: '专属行为模型', sub: '去训练', on: () => toast('info', '行为模型训练开发中') },
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="px-1 pt-1 text-[22px] font-extrabold" style={{ color: C.ink }}>健康数据</h1>

      {/* 评分 */}
      <Card className="!p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full text-white" style={{ background: G.green }}>
            <div className="text-center leading-none"><b className="text-[26px]">87</b><div className="text-[11px]">分</div></div>
          </div>
          <div>
            <b className="text-[16px]" style={{ color: C.ink }}>{pet.name} · 健康评分</b>
            <p className="mt-1 text-[12px]" style={{ color: C.sub }}>2026-10-19 · 智能分析昨日数据</p>
          </div>
        </div>
      </Card>

      {/* 三入口 */}
      <div className="grid grid-cols-3 gap-2">
        {summary.map((s) => (
          <button key={s.title} onClick={s.on} className="flex flex-col gap-1.5 rounded-[16px] bg-white p-3 text-left shadow-sm active:scale-95">
            <s.icon size={20} color={C.primary} />
            <b className="text-[12px]" style={{ color: C.ink }}>{s.title}</b>
            <span className="text-[11px]" style={{ color: s.sub === '去训练' ? C.primary : C.sub }}>{s.sub}</span>
          </button>
        ))}
      </div>

      {/* 今日 AI 日记 */}
      <Card style={{ background: G.soft }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: C.ink }}><BookHeart size={15} color={C.primary} /> 今日 AI 日记</span>
          <button className="text-[12px] font-semibold" style={{ color: C.sub }} onClick={() => openModal('chat')}>查看全部 ›</button>
        </div>
        <p className="text-[14px] font-semibold leading-relaxed" style={{ color: C.ink }}>「今天找了你 3 次，一起玩了 2 回合逗猫棒～下午在窗边睡了 6.2 小时，梦里好像在追蝴蝶 🦋」</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['晒太阳', '玩耍', '喝水×3', '等你'].map((t) => (
            <span key={t} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold" style={{ color: C.primary }}>{t}</span>
          ))}
        </div>
      </Card>
      {/* 行为数据 */}
      <SectionHeader title="行为数据" extra="52分19秒 ›" onExtra={() => toggleDrawer(true)} />
      <Card>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {BEH.map((b) => (
            <div key={b.l} className="rounded-xl bg-[#f4f7fc] py-2.5">
              <b className="block text-[13px]" style={{ color: C.ink }}>{b.v}</b>
              <span className="text-[10px]" style={{ color: C.sub }}>{b.l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 运动数据 */}
      <SectionHeader title="运动数据" extra="55分12秒 ›" onExtra={() => openModal('action')} />
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-3 text-white" style={{ background: 'linear-gradient(135deg,#FF8A5B,#F2574C)' }}>
            <Flame size={18} /><div className="mt-2 text-[11px] opacity-80">运动总量</div><b className="text-[18px]">288 卡</b>
          </div>
          <div className="rounded-2xl p-3 text-white" style={{ background: G.primary }}>
            <Footprints size={18} /><div className="mt-2 text-[11px] opacity-80">步数</div><b className="text-[18px]">6166 步</b>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-[#f4f7fc] py-2.5">
            <div className="flex items-center justify-center gap-1"><b className="text-[14px]" style={{ color: C.ink }}>6.1 分钟</b><span className="rounded bg-[#fde9e7] px-1.5 text-[10px] font-bold" style={{ color: C.danger }}>异常</span></div>
            <span className="text-[11px]" style={{ color: C.sub }}>奔跑时长</span>
          </div>
          <div className="rounded-xl bg-[#f4f7fc] py-2.5">
            <b className="block text-[14px]" style={{ color: C.ink }}>1.9 分钟</b><span className="text-[11px]" style={{ color: C.sub }}>跳跃时长</span>
          </div>
        </div>
      </Card>

      {/* 休息数据 */}
      <SectionHeader title="休息数据" extra="20时41分 ›" onExtra={() => toggleDrawer(true)} />
      <Card>
        <div className="mb-3 flex items-center gap-2"><Moon size={16} color={C.primary} /><b className="text-[13px]" style={{ color: C.ink }}>睡眠与休息</b></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {REST.map((r) => (
            <div key={r.l} className="rounded-xl bg-[#f4f7fc] py-2.5"><b className="block text-[14px]" style={{ color: C.ink }}>{r.v}</b><span className="text-[10px]" style={{ color: C.sub }}>{r.l}</span></div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#eef1f6] pt-3 text-center">
          {QUALITY.map((q) => (
            <div key={q.l}><div className="text-[18px]">{q.e}</div><b className="block text-[12px]" style={{ color: C.green }}>{q.s}</b><span className="text-[10px]" style={{ color: C.sub }}>{q.l}</span></div>
          ))}
        </div>
      </Card>
    </div>
  )
}
