export function timeHM(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts)
  const s = Math.floor(diff / 1000)
  if (s < 5) return '刚刚更新'
  if (s < 60) return `${s} 秒前更新`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} 分钟前更新`
  const h = Math.floor(m / 60)
  return `${h} 小时前更新`
}
