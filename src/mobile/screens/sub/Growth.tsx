import { useStore } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { Sprout, Award, Ruler, Cake } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'

const MILESTONES = [
  { d: '2026-10', t: '学会了「击掌」', s: '训练 3 天掌握，奖励小鱼干 🐟', e: '🎓' },
  { d: '2026-08', t: '第一次户外遛弯', s: '小区活动 25 分钟，很兴奋', e: '🌳' },
  { d: '2026-06', t: '体重达标 4.2kg', s: '从 3.6kg 稳步增长，身形匀称', e: '📈' },
  { d: '2026-03', t: '完成全部疫苗', s: '三联 + 狂犬，健康档案齐全', e: '💉' },
  { d: '2025-11', t: '来到这个家', s: '2 月龄回家，开启陪伴旅程', e: '🏡' },
]

export function GrowthScreen() {
  const pet = useStore((s) => s.pet)
  const toast = useStore((s) => s.toast)

  return (
    <SubScreen title="成长档案" right="记录" onRight={() => toast('info', '新增成长记录开发中')}>
      {/* 生命树头卡 */}
      <div className="overflow-hidden rounded-[22px] p-5 text-white" style={{ background: 'linear-gradient(160deg,#2f9e6e,#1f7d57)' }}>
        <div className="flex items-center gap-3">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/50"><PetFace pet={pet} size={64} /></span>
          <div>
            <div className="flex items-center gap-1.5"><Sprout size={16} /><b className="text-[17px]">{pet.name}的生命树</b></div>
            <p className="mt-0.5 text-[12px] text-white/80">{pet.species ?? '布偶猫'} · 已陪伴 358 天</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/15 py-2.5"><Cake size={15} className="mx-auto" /><b className="mt-1 block text-[15px]">1 岁 2 月</b><span className="text-[10px] text-white/70">年龄</span></div>
          <div className="rounded-2xl bg-white/15 py-2.5"><Ruler size={15} className="mx-auto" /><b className="mt-1 block text-[15px]">4.2 kg</b><span className="text-[10px] text-white/70">体重</span></div>
          <div className="rounded-2xl bg-white/15 py-2.5"><Award size={15} className="mx-auto" /><b className="mt-1 block text-[15px]">5</b><span className="text-[10px] text-white/70">成长里程碑</span></div>
        </div>
      </div>

      {/* 里程碑时间线 */}
      <div className="mb-2 mt-5 px-1 text-[15px] font-bold" style={{ color: C.ink }}>记忆时间线</div>
      <Card>
        <div className="flex flex-col">
          {MILESTONES.map((m, i) => (
            <div key={m.d} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[16px]" style={{ background: C.primarySoft }}>{m.e}</span>
                {i < MILESTONES.length - 1 && <span className="my-1 w-px flex-1 bg-[#e8ecf3]" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2"><b className="text-[14px]" style={{ color: C.ink }}>{m.t}</b><span className="text-[11px]" style={{ color: C.faint }}>{m.d}</span></div>
                <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>{m.s}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <button className="mt-3 w-full rounded-full py-3 text-[14px] font-bold text-white" style={{ background: G.primary }} onClick={() => toast('success', '已生成本月成长海报')}>生成成长海报</button>
    </SubScreen>
  )
}
