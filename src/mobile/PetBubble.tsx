import { useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { X } from 'lucide-react'
import { useMobileUi } from '@/mobile/useMobileUi'

/** 手机端桌宠悬浮窗：可拖动，点击看一眼 */
export function PetBubble() {
  const pet = useStore((s) => s.pet)
  const openCamera = useStore((s) => s.openCamera)
  const setBubble = useMobileUi((s) => s.setBubble)
  const [pos, setPos] = useState({ x: 300, y: 520 })
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null)

  const onDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false }
  }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    drag.current.moved = true
    setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy })
  }
  const onUp = () => {
    const moved = drag.current?.moved
    drag.current = null
    if (!moved) openCamera()
  }

  return (
    <div
      className="absolute z-[55] touch-none"
      style={{ left: Math.max(6, Math.min(pos.x, 360)), top: Math.max(60, Math.min(pos.y, 780)) }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
    >
      <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 border-white bg-[#eaf1ff] shadow-[0_8px_24px_rgba(31,60,120,.3)]">
        <PetFace pet={pet} size={60} />
      </div>
      <button onClick={(e) => { e.stopPropagation(); setBubble(false) }} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-black/55 text-white" aria-label="关闭悬浮窗"><X size={12} /></button>
    </div>
  )
}
