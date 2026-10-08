import { describe, it, expect } from 'vitest'
import { summarizeDay, buildDiary, eventsForPet, activityDigest, fmtDuration } from './diary'
import type { HomeMap, PetEvent } from '@/domain/types'

const home = {
  rooms: [
    { id: 'r_living', name: '客厅' },
    { id: 'r_bed', name: '卧室' },
  ],
} as unknown as HomeMap

const ev = (type: PetEvent['type'], extra: Partial<PetEvent> = {}): PetEvent =>
  ({ id: Math.random().toString(36), timestamp: 1, type, title: '', detail: '', ...extra } as PetEvent)

describe('eventsForPet', () => {
  it('按 petId 归属，未标注归到主宠物', () => {
    const evs = [ev('eat', { petId: 'a' }), ev('drink', { petId: 'b' }), ev('play')]
    expect(eventsForPet(evs, 'a', 'a')).toHaveLength(2) // a 的 + 未标注(归 a)
    expect(eventsForPet(evs, 'b', 'a')).toHaveLength(1)
  })
})

describe('buildDiary', () => {
  it('事实部分来自真实摘要（吃/喝/玩次数出现在文案里）', () => {
    const evs = [
      ev('room_change', { toRoomId: 'r_living' }),
      ev('eat'),
      ev('eat'),
      ev('drink'),
      ev('play'),
      ev('owner_interaction'),
    ]
    const sum = summarizeDay(evs, home)
    const text = buildDiary(sum, false, 0)
    expect(text).toContain('吃了 2 顿饭')
    expect(text).toContain('喝了 1 次水')
    expect(text).toContain('玩了 1 回')
    expect(text).toContain('远程陪了我 1 次')
    expect(text).toContain('客厅')
  })

  it('无事件时给出安静文案而非编造', () => {
    const sum = summarizeDay([], home)
    const text = buildDiary(sum, false, 0)
    expect(text).toContain('比较安静')
  })

  it('换一条（seed 不同）措辞可变化', () => {
    const sum = summarizeDay([ev('eat')], home)
    const a = buildDiary(sum, false, 0)
    const b = buildDiary(sum, false, 1)
    expect(a).not.toBe(b)
  })

  it('低情绪基调含温和陪伴措辞', () => {
    const sum = summarizeDay([], home)
    const text = buildDiary(sum, true, 0)
    expect(text).toMatch(/想你|走走|抱抱/)
  })
})

describe('activityDigest / fmtDuration', () => {
  const T = 1_000_000_000_000
  const at = (type: PetEvent['type'], minsAgo: number): PetEvent =>
    ({ id: Math.random().toString(36), timestamp: T - minsAgo * 60000, type, title: '', detail: '' } as PetEvent)

  it('计数来自真实事件', () => {
    const d = activityDigest([at('eat', 100), at('eat', 90), at('play', 80), at('room_change', 70), at('owner_interaction', 60)], T)
    expect(d.eats).toBe(2)
    expect(d.plays).toBe(1)
    expect(d.roomChanges).toBe(1)
    expect(d.owner).toBe(1)
  })

  it('相邻活跃事件间隔<=30min 记为活动，大间隔记为休息', () => {
    // 事件：120、110、100 分钟前（间隔 10min，活跃 20min），之后到 now 的 100min 空档记为休息
    const d = activityDigest([at('play', 120), at('play', 110), at('play', 100)], T)
    expect(d.activeMinutes).toBe(20)
    expect(d.restMinutes).toBeGreaterThanOrEqual(100)
  })

  it('fmtDuration 可读化', () => {
    expect(fmtDuration(0.2)).toContain('不到')
    expect(fmtDuration(45)).toBe('约 45 分钟')
    expect(fmtDuration(60)).toBe('约 1 小时')
    expect(fmtDuration(135)).toBe('约 2 小时 15 分')
  })
})
