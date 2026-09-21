import { describe, it, expect } from 'vitest'
import {
  bounds,
  centroid,
  fitFenceRect,
  inferRoomKind,
  nearestRoomIdWith,
  pointInPolygon,
  rectPoints,
} from './geometry'
import type { Room } from './types'

const mkRoom = (id: string, x: number, y: number, w: number, h: number): Room => ({
  id,
  name: id,
  kind: 'custom',
  polygon: rectPoints(x, y, w, h),
  devices: [],
  environment: { temperature: 26, humidity: 55, updatedAt: 0 },
})

describe('geometry', () => {
  it('pointInPolygon detects inside/outside', () => {
    const sq = rectPoints(0, 0, 100, 100)
    expect(pointInPolygon({ x: 50, y: 50 }, sq)).toBe(true)
    expect(pointInPolygon({ x: 150, y: 50 }, sq)).toBe(false)
  })

  it('centroid & bounds', () => {
    const sq = rectPoints(0, 0, 100, 60)
    expect(centroid(sq)).toEqual({ x: 50, y: 30 })
    expect(bounds(sq)).toEqual({ x: 0, y: 0, w: 100, h: 60 })
  })

  it('inferRoomKind by name', () => {
    expect(inferRoomKind('主卧室')).toBe('bedroom')
    expect(inferRoomKind('书房')).toBe('study')
    expect(inferRoomKind('餐厅')).toBe('dining')
    expect(inferRoomKind('阳台')).toBe('balcony')
    expect(inferRoomKind('客厅')).toBe('living')
    expect(inferRoomKind('宠物房')).toBe('custom')
  })

  it('nearestRoomIdWith finds nearest room having a camera', () => {
    const rooms = [mkRoom('a', 0, 0, 100, 100), mkRoom('b', 900, 0, 100, 100), mkRoom('c', 120, 0, 100, 100)]
    const near = nearestRoomIdWith(rooms, 'a', (r) => r.id === 'b' || r.id === 'c')
    expect(near).toBe('c')
  })

  it('fitFenceRect returns rect enclosing all rooms with margin', () => {
    const rooms = [mkRoom('a', 100, 100, 100, 100), mkRoom('b', 300, 300, 100, 100)]
    const rect = fitFenceRect(rooms, 20)
    expect(rect).toHaveLength(4)
    expect(rect[0].x).toBe(80)
    expect(rect[2].x).toBe(420)
  })
})
