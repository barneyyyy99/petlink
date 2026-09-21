// 本地通知：用于走失告警 / 找主人铃铛 / 陪伴提醒等应用内事件。
// 通过 Service Worker registration.showNotification（PWA 安装后即使切到后台/锁屏也能弹）；
// 未安装时回退到 Notification 构造函数。
// 说明：真正的“应用完全关闭时由服务器推送”需要 Web Push（VAPID + 后端），见 README。

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  return notificationsSupported() ? Notification.permission : 'denied'
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const res = await Notification.requestPermission()
  return res === 'granted'
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'petlink',
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, options)
      return
    }
  } catch {
    /* 回退 */
  }
  try {
    new Notification(title, options)
  } catch {
    /* 忽略 */
  }
}
