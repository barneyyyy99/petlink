// Web Push 客户端：订阅 PushManager 并调用服务端发送真实推送。
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC as string | undefined

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC as string),
  })
}

/** 订阅并请求服务端立刻推送一条测试消息（验证真实 Web Push 通道） */
export async function sendTestPush(payload: { title: string; body: string; url?: string }): Promise<boolean> {
  const sub = await getPushSubscription()
  if (!sub) return false
  const res = await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub, payload }),
  })
  return res.ok
}
