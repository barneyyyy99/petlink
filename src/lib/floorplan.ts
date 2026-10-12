import { MAP_W, MAP_H } from '@/domain/geometry'
import type { Point } from '@/domain/types'

/**
 * 从户型图自动识别房间（客户端轻量 CV）：
 * 1) 缩小到网格并二值化：深色线条视为墙(barrier)，其余为可通行区域；
 * 2) 对非墙像素做连通域标记，排除贴边的外部背景，保留被墙围住的"房间"连通域；
 * 3) 每个房间取外接矩形，按比例映射回地图坐标，内缩避开墙体。
 * 返回房间多边形（地图坐标）列表。识别不到返回空数组。
 */
export async function detectRoomsFromImage(dataUrl: string): Promise<Point[][]> {
  const img = await loadImage(dataUrl)
  const GW = 240
  const GH = Math.max(60, Math.min(240, Math.round((GW * img.height) / img.width)))
  const canvas = document.createElement('canvas')
  canvas.width = GW
  canvas.height = GH
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, GW, GH)
  const { data } = ctx.getImageData(0, 0, GW, GH)

  const N = GW * GH
  const isWall = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    isWall[i] = a > 40 && lum < 125 ? 1 : 0
  }

  // 连通域（4 邻接）标记非墙像素
  const label = new Int32Array(N).fill(-1)
  const stack: number[] = []
  type Comp = { minx: number; miny: number; maxx: number; maxy: number; area: number; border: boolean }
  const comps: Comp[] = []
  for (let s = 0; s < N; s++) {
    if (isWall[s] || label[s] !== -1) continue
    const id = comps.length
    stack.length = 0
    stack.push(s)
    label[s] = id
    let minx = GW, miny = GH, maxx = 0, maxy = 0, area = 0, border = false
    while (stack.length) {
      const p = stack.pop() as number
      const x = p % GW
      const y = (p / GW) | 0
      area++
      if (x < minx) minx = x
      if (x > maxx) maxx = x
      if (y < miny) miny = y
      if (y > maxy) maxy = y
      if (x === 0 || y === 0 || x === GW - 1 || y === GH - 1) border = true
      if (x > 0 && !isWall[p - 1] && label[p - 1] === -1) { label[p - 1] = id; stack.push(p - 1) }
      if (x < GW - 1 && !isWall[p + 1] && label[p + 1] === -1) { label[p + 1] = id; stack.push(p + 1) }
      if (y > 0 && !isWall[p - GW] && label[p - GW] === -1) { label[p - GW] = id; stack.push(p - GW) }
      if (y < GH - 1 && !isWall[p + GW] && label[p + GW] === -1) { label[p + GW] = id; stack.push(p + GW) }
    }
    comps.push({ minx, miny, maxx, maxy, area, border })
  }

  // __FIT__
  const minArea = N * 0.004
  const maxArea = N * 0.6
  let rooms = comps.filter((c) => !c.border && c.area >= minArea && c.area <= maxArea)
  if (rooms.length === 0) {
    // 图像裁切很紧、房间贴边：排除面积最大的连通域（视为外部），其余按面积阈值保留
    const sorted = [...comps].sort((a, b) => b.area - a.area)
    const exterior = sorted[0]
    rooms = comps.filter((c) => c !== exterior && c.area >= minArea && c.area <= maxArea)
  }
  rooms.sort((a, b) => b.area - a.area)
  rooms = rooms.slice(0, 16)

  const scale = Math.min(MAP_W / GW, MAP_H / GH)
  const offx = (MAP_W - GW * scale) / 2
  const offy = (MAP_H - GH * scale) / 2
  const inset = 6

  const polys: Point[][] = []
  for (const c of rooms) {
    const x = offx + c.minx * scale + inset
    const y = offy + c.miny * scale + inset
    const w = (c.maxx - c.minx + 1) * scale - inset * 2
    const h = (c.maxy - c.miny + 1) * scale - inset * 2
    if (w < 36 || h < 28) continue // 过窄的可能是走廊/误检，跳过
    polys.push([
      { x: Math.round(x), y: Math.round(y) },
      { x: Math.round(x + w), y: Math.round(y) },
      { x: Math.round(x + w), y: Math.round(y + h) },
      { x: Math.round(x), y: Math.round(y + h) },
    ])
  }
  return polys
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
