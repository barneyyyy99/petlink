import { useStore } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { Smile, Star, Bookmark, Heart, Settings, Battery, ArrowLeftRight, Sparkles } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Ring } from '@/mobile/MobileShell'
import { useNav } from '@/mobile/nav'

export function Duxiaodu() {
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const setActivePet = useStore((s) => s.setActivePet)
  const setCompanionEnabled = useStore((s) => s.setCompanionEnabled)
  const companionEnabled = useStore((s) => s.companionEnabled)
  const toast = useStore((s) => s.toast)
  const { openSub } = useNav()

  const cyclePet = () => {
    if (pets.length < 2) return
    const i = pets.findIndex((p) => p.id === pet.id)
    setActivePet(pets[(i + 1) % pets.length].id)
  }

  const floaters = [
    { icon: Smile, label: '情绪', on: () => { setCompanionEnabled(!companionEnabled); toast('success', companionEnabled ? '已关闭情绪陪伴' : '已开启情绪陪伴') } },
    { icon: Star, label: '装扮', on: () => openSub('persona') },
    { icon: Bookmark, label: '日记', on: () => openSub('diary') },
    { icon: Heart, label: '成长', on: () => openSub('growth') },
  ]

  return (
    <div className="relative -mx-4 -mt-1 min-h-full px-4 pt-1" style={{ background: 'linear-gradient(180deg,#9EC6FF 0%,#BCD8FF 30%,#E7D9C2 62%,#EAD6B8 100%)' }}>
      {/* 顶部：宠物 pill + 设置 */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex items-center gap-2 rounded-full bg-white/55 px-2 py-1.5 pr-3 backdrop-blur">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white"><PetFace pet={pet} size={36} /></span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5"><b className="text-[14px]" style={{ color: '#20324f' }}>{pet.name}</b><span className="text-[11px]" style={{ color: '#3b5171' }}>已守护 23 天</span></div>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: '#3b5171' }}><Battery size={12} /> 充电中 · {pet.collarBattery}%</div>
          </div>
          <button onClick={cyclePet} className="ml-1 grid h-6 w-6 place-items-center rounded-full bg-white/60" aria-label="切换宠物"><ArrowLeftRight size={13} color="#3b5171" /></button>
        </div>
        <button onClick={() => openSub('collar')} className="grid h-10 w-10 place-items-center rounded-full bg-white/70 backdrop-blur" aria-label="项圈设置"><Settings size={19} color="#3b5171" /></button>
      </div>

      {/* 三环 */}
      <div className="mx-auto mt-3 w-[72%] rounded-[20px] bg-white/55 p-3 backdrop-blur">
        <div className="flex items-center justify-around">
          <Ring value={80} label="心情值" size={58} color="#F59E3C" />
          <Ring value={92} label="活力值" size={58} color={C.primary} />
          <Ring value={88} label="元气值" size={58} color={C.green} />
        </div>
      </div>

      {/* 右侧竖排浮窗 */}
      <div className="absolute right-3 top-[180px] flex flex-col gap-4">
        {floaters.map((f) => (
          <button key={f.label} onClick={f.on} className="flex flex-col items-center gap-1">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/85 shadow-sm backdrop-blur"><f.icon size={19} color={C.primary} /></span>
            <span className="text-[11px] font-semibold" style={{ color: '#3b5171' }}>{f.label}</span>
          </button>
        ))}
      </div>

      {/* 对话气泡 */}
      <div className="mt-24 rounded-[20px] bg-white/85 px-4 py-3.5 text-center text-[15px] font-bold leading-relaxed shadow-sm backdrop-blur" style={{ color: C.ink }}>
        主人，你回来啦～我刚晒完太阳，超级暖和！
      </div>

      {/* 宠物大图 + 生成3D + 超能小度入口 */}
      <div className="relative mt-5 grid place-items-center pb-6">
        <button onClick={() => openSub('persona')} className="relative grid h-[190px] w-[190px] place-items-center overflow-hidden rounded-full shadow-[0_14px_30px_rgba(40,60,90,.25)]" style={{ background: 'radial-gradient(circle at 50% 35%, #4a9bf0, #2f6fd0)' }}>
          <PetFace pet={pet} size={190} />
          <span className="absolute bottom-3 rounded-full bg-black/35 px-2.5 py-0.5 text-[11px] font-bold text-white">3D 形象</span>
        </button>

        <button onClick={() => openSub('persona')} className="absolute right-0 top-6 flex w-[72px] flex-col items-center gap-0.5 rounded-2xl bg-white/90 py-2.5 shadow-sm backdrop-blur">
          <Sparkles size={18} color={C.primary} />
          <span className="text-[11px] font-bold leading-tight" style={{ color: C.ink }}>生成<br />3D形象</span>
        </button>

        <button onClick={() => openSub('superdu')} className="absolute bottom-6 right-0 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_8px_20px_rgba(61,127,255,.5)]" style={{ background: G.primary }} aria-label="超能小度">
          <span className="text-2xl">🤖</span>
        </button>
      </div>
    </div>
  )
}
