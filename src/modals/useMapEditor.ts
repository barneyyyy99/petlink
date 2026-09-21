import { useCallback, useRef, useState } from 'react'
import type { Point, Room } from '@/domain/types'
import {
  MAP_W,
  MAP_H,
  bounds,
  clampPoint,
  clone,
  inferRoomKind,
  makeId,
  pointInPolygon,
  rectPoints,
  roomCentroid,
} from '@/domain/geometry'

export type EditorTool = 'rect' | 'poly' | 'select'

export function useMapEditor() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selected, setSelected] = useState<number>(-1)
  const [tool, setToolState] = useState<EditorTool>('select')
  const [polyDraft, setPolyDraft] = useState<Point[]>([])
  const undoStack = useRef<Room[][]>([])
  const redoStack = useRef<Room[][]>([])

  const snapshot = useCallback(() => {
    undoStack.current.push(clone(rooms))
    if (undoStack.current.length > 50) undoStack.current.shift()
    redoStack.current = []
  }, [rooms])

  const load = useCallback((initial: Room[]) => {
    setRooms(clone(initial))
    setSelected(initial.length ? 0 : -1)
    setToolState('select')
    setPolyDraft([])
    undoStack.current = []
    redoStack.current = []
  }, [])

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push(clone(rooms))
    setRooms(prev)
    setSelected((s) => Math.min(s, prev.length - 1))
  }, [rooms])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(clone(rooms))
    setRooms(next)
  }, [rooms])

  const newRoom = useCallback((poly: Point[]): Room => ({
    id: makeId('room'),
    name: `新房间 ${rooms.length + 1}`,
    kind: 'custom',
    polygon: poly,
    devices: [],
    environment: { temperature: 26, humidity: 55, updatedAt: Date.now() },
  }), [rooms.length])

  const addRect = useCallback((x: number, y: number, w: number, h: number) => {
    snapshot()
    setRooms((rs) => {
      const r = newRoom(rectPoints(x, y, w, h))
      const next = [...rs, r]
      setSelected(next.length - 1)
      return next
    })
    setToolState('select')
  }, [snapshot, newRoom])

  const addPreset = useCallback(() => {
    snapshot()
    setRooms((rs) => {
      const idx = rs.length
      const x = 90 + ((idx * 43) % 520)
      const y = 90 + ((idx * 31) % 280)
      const r: Room = { ...newRoom(rectPoints(x, y, 220, 140)), name: `新房间 ${idx + 1}` }
      const next = [...rs, r]
      setSelected(next.length - 1)
      return next
    })
    setToolState('select')
  }, [snapshot, newRoom])

  const finishPoly = useCallback(() => {
    if (polyDraft.length < 3) return false
    snapshot()
    setRooms((rs) => {
      const r = newRoom(polyDraft.map((p) => ({ ...p })))
      const next = [...rs, r]
      setSelected(next.length - 1)
      return next
    })
    setPolyDraft([])
    setToolState('select')
    return true
  }, [polyDraft, snapshot, newRoom])

  const mutateSelected = useCallback(
    (fn: (r: Room) => Room, snap = true) => {
      if (snap) snapshot()
      setRooms((rs) => rs.map((r, i) => (i === selected ? fn(clone(r)) : r)))
    },
    [selected, snapshot],
  )

  // 按索引直接修改，避免依赖异步的 selected 状态（重命名等）
  const mutateAt = useCallback(
    (index: number, fn: (r: Room) => Room, snap = true) => {
      if (snap) snapshot()
      setRooms((rs) => rs.map((r, i) => (i === index ? fn(clone(r)) : r)))
    },
    [snapshot],
  )

  const renameAt = useCallback(
    (index: number, name: string) => mutateAt(index, (r) => ({ ...r, name: name || r.name, kind: inferRoomKind(name) }), false),
    [mutateAt],
  )

  const setName = useCallback((name: string) => mutateSelected((r) => ({ ...r, name: name || r.name, kind: inferRoomKind(name) }), false), [mutateSelected])
  const setKind = useCallback((kind: Room['kind']) => mutateSelected((r) => ({ ...r, kind })), [mutateSelected])
  const nudge = useCallback((dx: number, dy: number) => mutateSelected((r) => ({ ...r, polygon: r.polygon.map((p) => clampPoint({ x: p.x + dx, y: p.y + dy })) })), [mutateSelected])
  const scale = useCallback((sx: number, sy: number) => mutateSelected((r) => {
    const c = roomCentroid(r)
    return { ...r, polygon: r.polygon.map((p) => clampPoint({ x: c.x + (p.x - c.x) * sx, y: c.y + (p.y - c.y) * sy })) }
  }), [mutateSelected])
  const addVertex = useCallback(() => mutateSelected((r) => {
    let bi = 0, bd = -1
    for (let i = 0; i < r.polygon.length; i++) {
      const a = r.polygon[i], b = r.polygon[(i + 1) % r.polygon.length]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d > bd) { bd = d; bi = i }
    }
    const a = r.polygon[bi], b = r.polygon[(bi + 1) % r.polygon.length]
    const poly = [...r.polygon]
    poly.splice(bi + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
    return { ...r, polygon: poly }
  }), [mutateSelected])
  const removeVertex = useCallback((vi: number) => mutateSelected((r) => {
    if (r.polygon.length <= 3) return r
    return { ...r, polygon: r.polygon.filter((_, i) => i !== vi) }
  }), [mutateSelected])
  const duplicate = useCallback(() => {
    snapshot()
    setRooms((rs) => {
      if (selected < 0) return rs
      const src = clone(rs[selected])
      const dup: Room = { ...src, id: makeId('room'), name: src.name + ' 副本', polygon: src.polygon.map((p) => clampPoint({ x: p.x + 35, y: p.y + 35 })), devices: [] }
      const next = [...rs, dup]
      setSelected(next.length - 1)
      return next
    })
  }, [selected, snapshot])
  const remove = useCallback(() => {
    snapshot()
    setRooms((rs) => rs.filter((_, i) => i !== selected))
    setSelected((s) => Math.max(-1, s - 1))
  }, [selected, snapshot])
  const clear = useCallback(() => { snapshot(); setRooms([]); setSelected(-1); setPolyDraft([]) }, [snapshot])

  const hitRoom = useCallback((p: Point) => {
    for (let i = rooms.length - 1; i >= 0; i--) if (pointInPolygon(p, rooms[i].polygon)) return i
    return -1
  }, [rooms])

  const setTool = useCallback((t: EditorTool) => { setToolState(t); if (t !== 'poly') setPolyDraft([]) }, [])

  return {
    rooms, setRooms, selected, setSelected, tool, setTool, polyDraft, setPolyDraft,
    load, undo, redo, snapshot, addRect, addPreset, finishPoly, mutateSelected, mutateAt, renameAt,
    setName, setKind, nudge, scale, addVertex, removeVertex, duplicate, remove, clear, hitRoom,
    canUndo: () => undoStack.current.length > 0, canRedo: () => redoStack.current.length > 0,
    MAP_W, MAP_H, bounds,
  }
}
