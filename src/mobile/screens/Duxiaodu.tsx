import { useStore } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { Smile, Shirt, BookHeart, Sprout, Battery, Wand2 } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card, Ring } from '@/mobile/MobileShell'
import { useNav } from '@/mobile/nav'
import type { MTab } from '@/mobile/MobileApp'

export function Duxiaodu({ go }: { go: (t: MTab) => void }) {
  const pet = useStore((s) => s.pet)
  const openModal = useStore((s) => s.openModal)
  const setCompanionEnabled = useStore((s) => s.setCompanionEnabled)
  const companionEnabled = useStore((s) => s.companionEnabled)
  const toast = useStore((s) => s.toast)
  const { openSub } = useNav()

  const actions = [
    { icon: Smile, label: '情绪', on: () => { setCompanionEnabled(!companionEnabled); toast('success', companionEnabled ? '已关闭情绪陪伴' : '已开启情绪陪伴') } },
    { icon: Shirt, label: '装扮', on: () => openSub('persona') },
    { icon: BookHeart, label: '日记', on: () => go('health') },
    { icon: Sprout, label: '成长', on: () => go('health') },
  ]

  return (
    <div className="flex flex-col gap-3.5 pt-1">
      {/* 宠物头部 */}
      <Card style={{ background: G.soft }} className="!p-4">
        <div className="flex items-center gap-3">
          <button className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white" onClick={() => openSub('persona')}><PetFace pet={pet} size={56} /></button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><b className="text-[18px]" style={{ color: C.ink }}>{pet.name}</b><span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold" style={{ color: C.primary }}>已守护 23 天</span></div>
            <div className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: C.sub }}><Battery size={14} color={C.green} /> 充电中 · {pet.collarBattery}%</div>
          </div>
        </div>
      </Card>

      {/* 三环 */}
      <Card>
        <div className="flex items-center justify-around">
          <Ring value={80} label="心情值" color="#F59E3C" />
          <Ring value={92} label="活力值" color={C.primary} />
          <Ring value={88} label="元气值" color={C.green} />
        </div>
      </Card>

      {/* 四入口 */}
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <button key={a.label} onClick={a.on} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-white py-3 shadow-sm active:scale-95">
            <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: C.primarySoft }}><a.icon size={19} color={C.primary} /></span>
            <span className="text-[12px]" style={{ color: C.ink }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* 对话气泡 + 3D 形象 */}
      <div className="relative overflow-hidden rounded-[22px] p-5 text-white" style={{ background: G.night }}>
        <div className="rounded-2xl rounded-bl-sm bg-white/12 p-3.5 text-[14px] font-semibold leading-relaxed backdrop-blur">
          主人，你回来啦～我刚晒完太阳，超级暖和！
        </div>
        <div className="mt-4 grid place-items-center">
          <div className="grid h-[150px] w-[150px] place-items-center overflow-hidden rounded-full bg-white/10">
            <PetFace pet={pet} size={150} />
          </div>
          <span className="mt-2 text-[11px] text-white/55">3D 形象 · 个性装扮</span>
        </div>
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold text-white active:scale-95" style={{ background: G.primary }} onClick={() => openSub('persona')}>
          <Wand2 size={17} /> 生成 3D 形象
        </button>
      </div>

      {/* 和小度对话入口 */}
      <Card onClick={() => openModal('chat')} className="!p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg" style={{ background: C.primarySoft }}>🐱</span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>和小度聊聊{pet.name}</b><span className="text-[11px]" style={{ color: C.sub }}>问它今天去了哪、吃了没、心情如何</span></div>
        </div>
      </Card>
    </div>
  )
}
