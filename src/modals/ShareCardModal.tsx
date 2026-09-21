import { useEffect, useRef } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { Modal } from '@/components/Modal'
import { drawShareCard } from '@/lib/shareCard'

export function ShareCardModal() {
  const open = useStore((s) => s.modal === 'shareCard')
  const close = useStore((s) => s.closeModal)
  const pet = useStore((s) => s.pet)
  const lost = useStore((s) => s.lost)
  const room = useStore(currentRoom)
  const toast = useStore((s) => s.toast)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const lastRoom = useStore((s) => s.homeMap.rooms.find((r) => r.id === lost.lastRoomId)?.name) ?? room?.name ?? '家附近'

  useEffect(() => {
    if (open && canvasRef.current) drawShareCard(canvasRef.current, pet.name, lastRoom)
  }, [open, pet.name, lastRoom])

  const download = () => {
    const c = canvasRef.current
    if (!c) return
    const a = document.createElement('a')
    a.download = `${pet.name}-寻宠卡片.png`
    a.href = c.toDataURL('image/png')
    a.click()
    toast('success', '寻宠卡片 PNG 已生成')
  }

  const share = async () => {
    const c = canvasRef.current
    if (!c) return
    if (navigator.share && typeof (navigator as any).canShare === 'function') {
      c.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `${pet.name}-寻宠卡片.png`, { type: 'image/png' })
        try {
          await navigator.share({ files: [file], title: '帮我找找毛球', text: 'PetLink 走失互寻' })
        } catch {
          toast('info', '已取消分享')
        }
      })
    } else {
      toast('info', '当前浏览器不支持系统分享，已改为导出图片')
      download()
    }
  }

  return (
    <Modal open={open} onClose={close} title="寻宠卡片图片示例" eyebrow="SHARE LOST PET CARD" desc="适合分享至群聊、朋友圈或附近宠友社区。" testId="share-card-modal">
      <div className="flex justify-center rounded-[22px] bg-[#e6eeea] p-4">
        <canvas ref={canvasRef} width={720} height={960} className="h-auto w-[min(360px,100%)] rounded-[22px] bg-white shadow-soft" />
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn btn-primary" onClick={download}>导出 PNG 图片</button>
        <button className="btn" onClick={share}>分享</button>
      </div>
    </Modal>
  )
}
