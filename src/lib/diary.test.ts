import { describe, it, expect } from 'vitest'
import { summarizeDay, buildDiary, eventsForPet } from './diary'
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
