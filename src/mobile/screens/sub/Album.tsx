import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { blobToDataUrl, downscaleDataUrl } from '@/lib/image'
import { Plus, Camera } from 'lucide-react'
import { C } from '@/mobile/theme'
import { SubScreen } from '@/mobile/nav'

type Shot = { id: string; img?: string; e?: string; t: string }
const SEED: Shot[] = [
  { id: 's1', e: '☀️', t: '窗边晒太阳' }, { id: 's2', e: '🧶', t: '逗猫棒时刻' },
  { id: 's3', e: '😴', t: '午后小憩' }, { id: 's4', e: '🍚', t: '干饭现场' },
  { id: 's5', e: '🌳', t: '第一次遛弯' }, { id: 's6', e: '📦', t: '最爱的纸箱' },
]

export function AlbumScreen() {
  const pet = useStore((s) => s.pet)
  const toast = useStore((s) => s.toast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [shots, setShots] = useState<Shot[]>(() => (pet.photo ? [{ id: 'me', img: pet.photo, t: `${pet.name}的形象` }, ...SEED] : SEED))

  const pick = async (f?: File) => {
    if (!f) return
    try {
      const raw = await blobToDataUrl(f)
      const img = /gif|apng|webp/.test(f.type) ? raw : await downscaleDataUrl(raw, 640, 0.82)
      setShots((s) => [{ id: 'u' + Date.now(), img, t: '新照片' }, ...s])
      toast('success', '已添加到相册')
    } catch { toast('error', '图片读取失败') }
  }

  return (
    <SubScreen title="我的相册" right="上传" onRight={() => fileRef.current?.click()}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <p className="mb-3 px-1 text-[13px]" style={{ color: C.sub }}>{pet.name}的照片与精彩瞬间 · 共 {shots.length} 张</p>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed" style={{ borderColor: C.primary, color: C.primary }}>
          <Plus size={22} /><span className="text-[11px] font-bold">添加</span>
        </button>
        {shots.map((s) => (
          <div key={s.id} className="relative aspect-square overflow-hidden rounded-2xl bg-[#eef2f8]">
            {s.img ? <img src={s.img} alt={s.t} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-3xl">{s.e}</div>}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2 py-1 text-[10px] font-semibold text-white">{s.t}</span>
          </div>
        ))}
      </div>
      <button onClick={() => fileRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#5B9BFF,#3D7FFF)' }}>
        <Camera size={17} /> 上传新照片
      </button>
    </SubScreen>
  )
}
