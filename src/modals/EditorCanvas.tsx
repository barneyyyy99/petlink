import { useEffect, useRef } from 'react'
import type { Point } from '@/domain/types'
import { bounds, clampPoint, clone, rectPoints } from '@/domain/geometry'
import type { useMapEditor } from './useMapEditor'

type Editor = ReturnType<typeof useMapEditor>

export function EditorCanvas({ editor, bgImage }: { editor: Editor; bgImage: HTMLImageElement | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ action: 'rect' | 'move' | 'vertex' | null; start: Point; originPoly?: Point[]; vertex: number }>({ action: null, start: { x: 0, y: 0 }, vertex: -1 })
  const tempRect = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const { rooms, selected, tool, polyDraft } = editor

  const W = 1000, H = 600

  const toCanvas = (e: React.PointerEvent | React.MouseEvent): Point => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height }
  }

  const draw = () => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#f7faf8'
    ctx.fillRect(0, 0, W, H)
    if (bgImage && bgImage.complete && bgImage.naturalWidth) {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.drawImage(bgImage, 0, 0, W, H)
      ctx.restore()
    }
    ctx.strokeStyle = '#e4ebe7'
    ctx.lineWidth = 1
    for (let x = 0; x <= W; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y <= H; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
    rooms.forEach((room, i) => drawRoom(ctx, room.polygon, room.name, i === selected))
    const tr = tempRect.current
    if (tr) drawRoom(ctx, rectPoints(tr.x, tr.y, tr.w, tr.h), '新房间', true, true)
    if (polyDraft.length) {
      ctx.strokeStyle = '#2e7f75'
      ctx.lineWidth = 3
      ctx.beginPath()
      polyDraft.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.stroke()
      polyDraft.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fillStyle = '#2e7f75'; ctx.fill() })
    }
  }

  useEffect(draw)

  const onDown = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(e.pointerId)
    const p = toCanvas(e)
    drag.current.start = p
    if (tool === 'poly') {
      editor.setPolyDraft([...polyDraft, p])
      return
    }
    // 顶点命中
    let hitV: { room: number; vertex: number } | null = null
    let min = 20
    rooms.forEach((r, ri) => r.polygon.forEach((v, vi) => { const d = Math.hypot(v.x - p.x, v.y - p.y); if (d < min) { min = d; hitV = { room: ri, vertex: vi } } }))
    const roomHit = hitV ? (hitV as { room: number; vertex: number }).room : editor.hitRoom(p)
    if (tool === 'rect' && roomHit < 0) { drag.current.action = 'rect'; return }
    if (roomHit >= 0) {
      editor.setSelected(roomHit)
      if (tool === 'rect') editor.setTool('select')
      editor.snapshot()
      const room = rooms[roomHit]
      const vi = hitV && (hitV as { room: number; vertex: number }).room === roomHit ? (hitV as { room: number; vertex: number }).vertex : -1
      drag.current = { action: vi >= 0 ? 'vertex' : 'move', start: p, originPoly: clone(room.polygon), vertex: vi }
      return
    }
    editor.setSelected(-1)
  }

  const onMove = (e: React.PointerEvent) => {
    if (!drag.current.action) return
    const p = toCanvas(e)
    if (drag.current.action === 'rect') {
      tempRect.current = { x: Math.min(drag.current.start.x, p.x), y: Math.min(drag.current.start.y, p.y), w: Math.abs(p.x - drag.current.start.x), h: Math.abs(p.y - drag.current.start.y) }
      draw()
      return
    }
    if (selected < 0) return
    if (drag.current.action === 'move') {
      const dx = p.x - drag.current.start.x, dy = p.y - drag.current.start.y
      const origin = drag.current.originPoly!
      editor.mutateSelected((r) => ({ ...r, polygon: origin.map((v) => clampPoint({ x: v.x + dx, y: v.y + dy })) }), false)
    } else if (drag.current.action === 'vertex' && drag.current.vertex >= 0) {
      const vi = drag.current.vertex
      editor.mutateSelected((r) => ({ ...r, polygon: r.polygon.map((v, i) => (i === vi ? clampPoint(p) : v)) }), false)
    }
  }

  const onUp = (e: React.PointerEvent) => {
    if (drag.current.action === 'rect') {
      const p = toCanvas(e)
      const x = Math.min(drag.current.start.x, p.x), y = Math.min(drag.current.start.y, p.y)
      const w = Math.abs(p.x - drag.current.start.x), h = Math.abs(p.y - drag.current.start.y)
      if (w > 65 && h > 55) editor.addRect(x, y, w, h)
    }
    tempRect.current = null
    drag.current = { action: null, start: { x: 0, y: 0 }, vertex: -1 }
    draw()
  }

  return (
    <div className="rounded-[20px] bg-[#eef3f0] p-3">
      <canvas
        ref={canvasRef}
        data-testid="editor-canvas"
        width={W}
        height={H}
        className="block w-full rounded-[14px] bg-white"
        style={{ aspectRatio: '5 / 3', height: 'auto', touchAction: 'none', cursor: tool === 'select' ? 'default' : 'crosshair' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onDoubleClick={(e) => {
          if (tool === 'poly') { editor.finishPoly(); return }
          // 选中房间时，双击某个顶点即可删除（≥3 保护）
          if (selected < 0) return
          const p = toCanvas(e)
          const room = editor.rooms[selected]
          if (!room) return
          let vi = -1
          let min = 14
          room.polygon.forEach((v, i) => { const d = Math.hypot(v.x - p.x, v.y - p.y); if (d < min) { min = d; vi = i } })
          if (vi >= 0) editor.removeVertex(vi)
        }}
      />
    </div>
  )
}

function drawRoom(ctx: CanvasRenderingContext2D, pts: Point[], name: string, selected = false, temp = false) {
  if (pts.length < 3) return
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
  ctx.fillStyle = temp ? 'rgba(76,160,146,.10)' : selected ? 'rgba(212,239,230,.92)' : 'rgba(255,255,255,.94)'
  ctx.strokeStyle = temp ? '#4ca092' : selected ? '#2e7f75' : '#aec3ba'
  ctx.lineWidth = selected ? 4 : 3
  ctx.fill()
  ctx.stroke()
  const b = bounds(pts)
  ctx.fillStyle = '#52665e'
  ctx.font = 'bold 18px sans-serif'
  ctx.fillText(name || '房间', b.x + 12, b.y + 26)
  if (selected) {
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill()
      ctx.strokeStyle = '#2e7f75'; ctx.lineWidth = 4; ctx.stroke()
      ctx.fillStyle = '#2e7f75'; ctx.font = '9px sans-serif'; ctx.fillText(String(i + 1), p.x - 2.5, p.y + 3)
    })
  }
}
