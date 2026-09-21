import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore, getSnapshot, applySnapshot } from './useStore'
import { rectPoints } from '@/domain/geometry'
import { SCHEMA_VERSION } from '@/domain/seed'
import type { Room } from '@/domain/types'

const mkRoom = (id: string, name: string, x: number, y: number): Room => ({
  id,
  name,
  kind: 'custom',
  polygon: rectPoints(x, y, 200, 150),
  devices: [],
  environment: { temperature: 26, humidity: 55, updatedAt: 0 },
})

describe('store', () => {
  beforeEach(() => {
    useStore.getState().resetDemo()
  })

  it('seeds default home map with 5 rooms and pet in living room', () => {
    const s = useStore.getState()
    expect(s.homeMap.rooms).toHaveLength(5)
    expect(s.pet.roomId).toBe('room_living')
  })

  it('applyHomeMap bumps version, syncs fence, keeps pet in a valid room', () => {
    const before = useStore.getState().homeMap.version
    const rooms = [mkRoom('room_living', '客厅', 0, 0), mkRoom('r_new', '宠物房', 400, 0)]
    useStore.getState().applyHomeMap(rooms, '新家')
    const s = useStore.getState()
    expect(s.homeMap.version).toBe(before + 1)
    expect(s.homeMap.rooms).toHaveLength(2)
    expect(s.homeMap.name).toBe('新家')
    expect(s.fence.mapVersion).toBe(s.homeMap.version)
    expect(s.fence.points.length).toBeGreaterThanOrEqual(3)
    expect(s.homeMap.rooms.some((r) => r.id === s.pet.roomId)).toBe(true)
  })

  it('applyHomeMap moves pet to first room if its room was removed', () => {
    const rooms = [mkRoom('r_new', '宠物房', 0, 0)]
    useStore.getState().applyHomeMap(rooms)
    expect(useStore.getState().pet.roomId).toBe('r_new')
  })

  it('moveToRoom updates position, logs event, and completes camera handoff', () => {
    vi.useFakeTimers()
    const move = useStore.getState().moveToRoom
    move('room_bedroom')
    let s = useStore.getState()
    expect(s.pet.roomId).toBe('room_bedroom')
    expect(s.pet.behavior).toBe('running')
    expect(s.events[0].type).toBe('room_change')
    expect(s.handoff.phase).toBe('lost')

    vi.advanceTimersByTime(1600)
    s = useStore.getState()
    expect(s.handoff.phase).toBe('completed')
    expect(s.activeCameraId).toBe('dev_cam_bedroom')

    vi.advanceTimersByTime(500)
    expect(useStore.getState().pet.behavior).toBe('idle')
    vi.useRealTimers()
  })

  it('handoff reports no_camera when target room has no camera', () => {
    vi.useFakeTimers()
    // 新建一个无摄像头房间
    const rooms = [...useStore.getState().homeMap.rooms, mkRoom('r_nocam', '无摄像头房', 100, 450)]
    useStore.getState().applyHomeMap(rooms)
    useStore.getState().moveToRoom('r_nocam')
    vi.advanceTimersByTime(1600)
    expect(useStore.getState().handoff.phase).toBe('no_camera')
    vi.useRealTimers()
  })

  it('turnOnAC powers on the room AC (or nearest) synchronously', () => {
    useStore.getState().turnOnAC('room_living')
    const ac = useStore.getState().devices.find((d) => d.id === 'dev_ac_living')
    expect(ac?.status.power).toBe(true)
  })

  it('setRoomEnvironment updates only the target room', () => {
    useStore.getState().setRoomEnvironment('room_bedroom', 31, 70)
    const s = useStore.getState()
    expect(s.homeMap.rooms.find((r) => r.id === 'room_bedroom')?.environment.temperature).toBe(31)
    expect(s.homeMap.rooms.find((r) => r.id === 'room_living')?.environment.temperature).not.toBe(31)
  })

  it('bindDeviceToRoom keeps room.devices and device.roomId consistent', () => {
    useStore.getState().bindDeviceToRoom('dev_cam_living', 'room_bedroom')
    const s = useStore.getState()
    expect(s.devices.find((d) => d.id === 'dev_cam_living')?.roomId).toBe('room_bedroom')
    expect(s.homeMap.rooms.find((r) => r.id === 'room_bedroom')?.devices).toContain('dev_cam_living')
    expect(s.homeMap.rooms.find((r) => r.id === 'room_living')?.devices).not.toContain('dev_cam_living')
  })

  it('triggerBell adds a bell event and opens chat', () => {
    useStore.getState().triggerBell()
    const s = useStore.getState()
    expect(s.modal).toBe('chat')
    expect(s.events[0].type).toBe('bell')
    expect(s.chat[s.chat.length - 1].kind).toBe('bell')
  })

  it('multi-pet: seeds two pets, switch/add/remove keeps pet mirror consistent', () => {
    let s = useStore.getState()
    expect(s.pets.length).toBe(2)
    expect(s.pet.id).toBe(s.activePetId)

    // 切换到第二只
    const second = s.pets[1].id
    useStore.getState().setActivePet(second)
    s = useStore.getState()
    expect(s.activePetId).toBe(second)
    expect(s.pet.id).toBe(second)

    // 新增宠物 → 成为当前
    useStore.getState().addPet('球球')
    s = useStore.getState()
    expect(s.pets.length).toBe(3)
    expect(s.pet.name).toBe('球球')

    // 移动当前宠物只影响它自己
    const otherBefore = s.pets.find((p) => p.id !== s.activePetId)!
    useStore.getState().moveToRoom('room_balcony')
    s = useStore.getState()
    expect(s.pet.roomId).toBe('room_balcony')
    expect(s.pets.find((p) => p.id === otherBefore.id)!.roomId).toBe(otherBefore.roomId)

    // 删除当前宠物 → 回退到其它宠物
    const removeId = s.activePetId
    useStore.getState().removePet(removeId)
    s = useStore.getState()
    expect(s.pets.find((p) => p.id === removeId)).toBeUndefined()
    expect(s.pet.id).toBe(s.activePetId)
  })

  it('rules CRUD works', () => {
    const n = useStore.getState().rules.length
    useStore.getState().addRule({ name: 't', trigger: 'enter_room', targetRoomId: 'current', targetDeviceType: 'ac', action: 'x', mode: 'suggest', enabled: true })
    expect(useStore.getState().rules).toHaveLength(n + 1)
    const id = useStore.getState().rules[n].id
    useStore.getState().toggleRule(id)
    expect(useStore.getState().rules[n].enabled).toBe(false)
    useStore.getState().removeRule(id)
    expect(useStore.getState().rules).toHaveLength(n)
  })

  it('applyHomeMap stores backgroundImage into synced snapshot (底图云同步)', () => {
    const fakeImg = 'data:image/jpeg;base64,AAAABBBBCCCC'
    useStore.getState().applyHomeMap([mkRoom('r1', '客厅', 0, 0)], '带底图的家', fakeImg)
    expect(useStore.getState().homeMap.backgroundImage).toBe(fakeImg)
    // 进入快照 → 会随云端同步 / 本地持久化
    expect(getSnapshot().homeMap.backgroundImage).toBe(fakeImg)
  })

  it('getSnapshot/applySnapshot round-trip syncs domain data (云端同步基础)', () => {
    useStore.getState().applyHomeMap([mkRoom('r_only', '唯一房', 0, 0)], '云端家')
    const snap = getSnapshot()
    expect(snap.homeMap.name).toBe('云端家')
    // 模拟另一设备重置后从云端快照恢复
    useStore.getState().resetDemo()
    expect(useStore.getState().homeMap.name).toBe('我的家')
    applySnapshot(snap)
    expect(useStore.getState().homeMap.name).toBe('云端家')
    expect(useStore.getState().homeMap.rooms).toHaveLength(1)
  })

  it('applySnapshot ignores mismatched schemaVersion', () => {
    const before = useStore.getState().homeMap.name
    applySnapshot({ schemaVersion: SCHEMA_VERSION + 99, homeMap: { ...getSnapshot().homeMap, name: '不该生效' } })
    expect(useStore.getState().homeMap.name).toBe(before)
  })
})
