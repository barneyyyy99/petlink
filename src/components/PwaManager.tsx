import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useStore } from '@/store/useStore'
import { notificationPermission, showLocalNotification } from '@/lib/notify'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const NOTIFY_TYPES = new Set(['bell', 'fence_alert', 'companion'])

export function PwaManager() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({})
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null)
  const events = useStore((s) => s.events)
  const lastEventId = useRef<string | null>(events[0]?.id ?? null)

  // 捕获安装提示
  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault()
      setInstallEvt(e as BIPEvent)
    }
    const onInstalled = () => setInstallEvt(null)
    window.addEventListener('beforeinstallprompt', onBIP)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // 新的关键事件 → 本地通知
  useEffect(() => {
    const top = events[0]
    if (!top || top.id === lastEventId.current) return
    lastEventId.current = top.id
    if (notificationPermission() === 'granted' && NOTIFY_TYPES.has(top.type)) {
      void showLocalNotification(`PetLink · ${top.title}`, top.detail ?? '')
    }
  }, [events])

  const doInstall = async () => {
    if (!installEvt) return
    await installEvt.prompt()
    setInstallEvt(null)
  }

  if (!needRefresh && !installEvt) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-[1000px]:bottom-24">
      {needRefresh && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-xs shadow-soft">
          <span className="text-ink">有新版本可用</span>
          <button className="btn btn-primary !py-1.5" onClick={() => updateServiceWorker(true)}>
            立即更新
          </button>
          <button className="btn !py-1.5" onClick={() => setNeedRefresh(false)}>
            稍后
          </button>
        </div>
      )}
      {installEvt && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-xs shadow-soft">
          <span className="text-ink">把 PetLink 添加到桌面？</span>
          <button className="btn btn-primary !py-1.5" data-testid="install-btn" onClick={doInstall}>
            安装
          </button>
          <button className="btn !py-1.5" onClick={() => setInstallEvt(null)}>
            以后
          </button>
        </div>
      )}
    </div>
  )
}
