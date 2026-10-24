import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import type { PetBehavior } from '@/domain/types'
import { PetFace } from '@/components/PetFace'
import { blobToDataUrl, downscaleDataUrl } from '@/lib/image'
import { Camera, Wand2, Check } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { SubScreen } from '@/mobile/nav'
import { generate3DAvatar } from '@/mobile/avatar3d'

const DYNAMIC: { e: string; label: string; b: PetBehavior }[] = [
  { e: '🪶', label: '逗猫', b: 'playing' }, { e: '😴', label: '睡觉', b: 'sleeping' },
  { e: '👅', label: '舔毛', b: 'idle' }, { e: '🐾', label: '走路', b: 'running' },
  { e: '👃', label: '嗅闻', b: 'looking' }, { e: '💨', label: '奔跑', b: 'running' },
]
const SKINS = ['原生写实', '宇航员', '小厨师', '国风', '赛博朋克', '圣诞']

export function PersonaScreen() {
  const pet = useStore((s) => s.pet)
  const setBehavior = useStore((s) => s.setBehavior)
  const setPetPhoto = useStore((s) => s.setPetPhoto)
  const toast = useStore((s) => s.toast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'dynamic' | 'skin'>('dynamic')
  const [skin, setSkin] = useState('原生写实')
  const [gen, setGen] = useState<{ on: boolean; p: number }>({ on: false, p: 0 })

  const pick = async (file?: File) => {
    if (!file) return
    try {
      const raw = await blobToDataUrl(file)
      const animated = /gif|apng/.test(file.type) || file.type === 'image/webp'
      const photo = animated ? raw : await downscaleDataUrl(raw, 640, 0.85)
      // 1) 先用照片替换宠物形象
      setPetPhoto(pet.id, photo)
      toast('success', `已用照片更新${pet.name}的形象`)
      // 2) 合成写实 3D 形象
      setGen({ on: true, p: 0 })
      const res = await generate3DAvatar(photo, (p) => setGen({ on: true, p }))
      setPetPhoto(pet.id, res.image)
      setSkin('原生写实')
      setGen({ on: false, p: 0 })
      toast('success', `${pet.name}的写实 3D 形象已生成`)
    } catch {
      setGen({ on: false, p: 0 })
      toast('error', '照片处理失败，请换一张')
    }
  }

  return (
    <SubScreen title="个性选择" right="保存" onRight={() => toast('success', '形象已保存')}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

      {/* 预览 */}
      <div className="relative overflow-hidden rounded-[22px] p-4" style={{ background: G.night }}>
        <div className="flex items-center justify-between">
          <b className="text-[15px] text-white">{pet.species ?? '布偶猫'} · {DYNAMIC.find((d) => d.b === pet.behavior)?.label ?? '逗猫'}</b>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white active:scale-95">
            <Camera size={14} /> 上传照片·重新生成写实形象
          </button>
        </div>
        <div className="mt-3 grid place-items-center">
          <div className="relative grid h-[180px] w-[180px] place-items-center overflow-hidden rounded-full bg-white/10">
            <PetFace pet={pet} size={180} />
            {gen.on && (
              <div className="absolute inset-0 grid place-items-center bg-black/55 text-white">
                <div className="text-[13px] font-bold">合成写实形象中…</div>
                <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${gen.p}%` }} /></div>
                <div className="mt-1 text-[11px]">{gen.p}%</div>
              </div>
            )}
          </div>
          <span className="mt-2 text-[11px] text-white/55">{pet.photo ? '当前为真实照片形象' : '上传照片可生成专属写实 3D 形象'}</span>
        </div>
        <button onClick={() => fileRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold text-white active:scale-95" style={{ background: G.primary }}>
          <Wand2 size={17} /> {pet.photo ? '重新生成 3D 形象' : '上传照片生成 3D 形象'}
        </button>
      </div>

      {/* 动态 / 皮肤 */}
      <div className="mt-4 flex rounded-full bg-[#eef2f8] p-1">
        <button onClick={() => setTab('dynamic')} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={tab === 'dynamic' ? { background: '#fff', color: C.primary } : { color: C.sub }}>动态</button>
        <button onClick={() => setTab('skin')} className="flex-1 rounded-full py-2 text-[14px] font-bold" style={tab === 'skin' ? { background: '#fff', color: C.primary } : { color: C.sub }}>皮肤</button>
      </div>

      {tab === 'dynamic' ? (
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {DYNAMIC.map((d) => (
            <button key={d.label} onClick={() => { setBehavior(d.b); toast('info', `${pet.name}：${d.label}`) }} className="flex flex-col items-center gap-1.5 rounded-[16px] bg-white py-4 shadow-sm active:scale-95" style={pet.behavior === d.b ? { outline: `2px solid ${C.primary}` } : {}}>
              <span className="text-2xl">{d.e}</span>
              <span className="text-[12px]" style={{ color: C.ink }}>{d.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {SKINS.map((s) => (
            <button key={s} onClick={() => { setSkin(s); toast('info', `已切换皮肤：${s}`) }} className="relative flex flex-col items-center gap-1.5 rounded-[16px] bg-white py-4 shadow-sm active:scale-95" style={skin === s ? { outline: `2px solid ${C.primary}` } : {}}>
              <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: C.primarySoft }}>🐱</span>
              <span className="text-[12px]" style={{ color: C.ink }}>{s}</span>
              {skin === s && <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full text-white" style={{ background: C.primary }}><Check size={11} /></span>}
            </button>
          ))}
        </div>
      )}
    </SubScreen>
  )
}
