import type { HomeMap, PetEvent } from '@/domain/types'

export type DiarySummary = {
  roomVisits: { roomName: string; count: number }[]
  eats: number
  drinks: number
  plays: number
  ownerInteractions: number
  bells: number
  roomChanges: number
}

/** 客观数据摘要：完全来自真实事件流，不含拟人化措辞 */
export function summarizeDay(events: PetEvent[], home: HomeMap): DiarySummary {
  const roomName = (id?: string) => home.rooms.find((r) => r.id === id)?.name ?? '其他'
  const visits = new Map<string, number>()
  let eats = 0,
    drinks = 0,
    plays = 0,
    ownerInteractions = 0,
    bells = 0,
    roomChanges = 0
  for (const e of events) {
    if (e.type === 'room_change') {
      roomChanges += 1
      const n = roomName(e.toRoomId ?? e.roomId)
      visits.set(n, (visits.get(n) ?? 0) + 1)
    }
    if (e.type === 'eat') eats += 1
    if (e.type === 'drink') drinks += 1
    if (e.type === 'play') plays += 1
    if (e.type === 'owner_interaction') ownerInteractions += 1
    if (e.type === 'bell') bells += 1
  }
  const roomVisits = [...visits.entries()]
    .map(([roomName, count]) => ({ roomName, count }))
    .sort((a, b) => b.count - a.count)
  return { roomVisits, eats, drinks, plays, ownerInteractions, bells, roomChanges }
}

/** 房间停留占比（用于历史模式热点），基于 room_change 目标房间计数 */
export function roomShare(events: PetEvent[], home: HomeMap): { roomName: string; pct: number }[] {
  const { roomVisits } = summarizeDay(events, home)
  const total = roomVisits.reduce((a, r) => a + r.count, 0) || 1
  return roomVisits.map((r) => ({ roomName: r.roomName, pct: Math.round((r.count / total) * 100) }))
}

const NORMAL_DIARY = [
  '你今天开会好多，我叫了你好几次。晚上能不能早点回来？',
  '我在阳台晒了好久太阳，还认真吃完了两顿饭。',
  '下午有点无聊，我把客厅和卧室来回巡视了三遍。',
  '你不在的时候，我先睡了一觉，又跑去看了看窗外。',
]

const LOW_MOOD_DIARY = [
  '今天听起来你有点没精神。带我出去走走吧？我今天也想多活动一会儿 🐾',
  '你今天说话听起来有点累，我已经在门口等你了。我们晚点出去走走？',
  '我今天找了你好几次。要不要先看看我，再决定晚上去哪里散步？',
]

/** 第一人称 AI 文案（拟人化，需与客观摘要视觉区分） */
export function generateDiaryText(lowMood: boolean, seed = Date.now()): string {
  const arr = lowMood ? LOW_MOOD_DIARY : NORMAL_DIARY
  return arr[Math.floor((seed / 1000) % arr.length)]
}
