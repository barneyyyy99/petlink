import webpush from 'web-push'

// Vercel Serverless Function：接收订阅 + 载荷，用 VAPID 发送真实 Web Push。
// 私钥仅存于服务端环境变量（VAPID_PRIVATE_KEY），绝不下发前端。

const PUBLIC = process.env.VAPID_PUBLIC || process.env.VITE_VAPID_PUBLIC || ''
const PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@petlink.app'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!PUBLIC || !PRIVATE) {
    res.status(500).json({ error: 'VAPID keys not configured on server' })
    return
  }
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { subscription, payload } = body || {}
    if (!subscription || !subscription.endpoint) {
      res.status(400).json({ error: 'Missing subscription' })
      return
    }
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload?.title || 'PetLink',
        body: payload?.body || '你有一条新的宠物提醒',
        url: payload?.url || '/',
      }),
    )
    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'push failed' })
  }
}
