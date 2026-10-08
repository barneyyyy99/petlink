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

/** 取某只宠物的事件：带 petId 的按 petId 归属；历史遗留未标注的归到主宠物 */
export function eventsForPet(events: PetEvent[], petId: string, primaryPetId?: string): PetEvent[] {
  return events.filter((e) => (e.petId ?? primaryPetId) === petId)
}

const pick = <T,>(arr: T[], seed: number): T => arr[Math.abs(Math.floor(seed)) % arr.length]

/**
 * 第一人称 AI 日记：由该宠物当日真实事件摘要生成（措辞拟人，事实部分完全来自数据）。
 * lowMood 为「情绪陪伴」被触发时的温和基调；seed 用于「换一条」在等价措辞间切换。
 */
export function buildDiary(s: DiarySummary, lowMood: boolean, seed = 0): string {
  const facts: string[] = []
  if (s.roomVisits.length) facts.push(`在${s.roomVisits[0].roomName}待的时间最久`)
  if (s.eats) facts.push(`吃了 ${s.eats} 顿饭`)
  if (s.drinks) facts.push(`喝了 ${s.drinks} 次水`)
  if (s.plays) facts.push(`玩了 ${s.plays} 回`)
  if (s.roomChanges) facts.push(`在家里转了 ${s.roomChanges} 趟`)

  const openers = lowMood
    ? ['今天家里有点安静，', '你今天好像挺忙的，', '我自己待了一会儿，']
    : ['今天过得挺充实的，', '又是元气满满的一天，', '今天我挺开心的，']
  const body = facts.length ? `我${facts.slice(0, 4).join('，')}。` : '今天比较安静，大部分时间都在休息。'
  const ownerLine =
    s.ownerInteractions > 0
      ? `你还远程陪了我 ${s.ownerInteractions} 次，我都感受到啦。`
      : '今天还没顾上陪我，有空来看看我呀。'
  const closers = lowMood
    ? ['晚上能早点回来吗？我想你了 🐾', '要不要带我出去走走？', '记得回家抱抱我。']
    : ['晚上等你回家！', '想你了，早点回来呀～', '今天也要开开心心哦。']

  return `${pick(openers, seed)}${body}${ownerLine}${pick(closers, seed + 1)}`
}

