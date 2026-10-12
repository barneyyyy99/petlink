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
  const gray = new Uint8Array(N)
  const hist = new Array(256).fill(0)
  for (let i = 0; i < N; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
    const lum = a > 40 ? ((0.299 * r + 0.587 * g + 0.114 * b) | 0) : 255
    gray[i] = lum
    hist[lum]++
  }
  // Otsu 自适应阈值（钳制到合理区间）；深色像素(<thr)视为墙，适配不同底图
  const thr = Math.max(70, Math.min(190, otsu(hist, N)))
  const isWall = new Uint8Array(N)
  for (let i = 0; i < N; i++) isWall[i] = gray[i] < thr ? 1 : 0

  // 形态学膨胀：封堵门洞/墙体缝隙，避免 flood fill 从门口漏到相邻房间或室外，
  // 否则大房间会和走廊/室外连成一片而被当作外部丢弃（真实户型图常见）。
  const DIL = 2
  const wall = dilate(isWall, GW, GH, DIL)

  // 连通域（4 邻接）标记非墙像素
  const label = new Int32Array(N).fill(-1)
  const stack: number[] = []
  type Comp = { minx: number; miny: number; maxx: number; maxy: number; area: number; border: boolean }
  const comps: Comp[] = []
  for (let s = 0; s < N; s++) {
    if (wall[s] || label[s] !== -1) continue
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
      if (x > 0 && !wall[p - 1] && label[p - 1] === -1) { label[p - 1] = id; stack.push(p - 1) }
      if (x < GW - 1 && !wall[p + 1] && label[p + 1] === -1) { label[p + 1] = id; stack.push(p + 1) }
      if (y > 0 && !wall[p - GW] && label[p - GW] === -1) { label[p - GW] = id; stack.push(p - GW) }
      if (y < GH - 1 && !wall[p + GW] && label[p + GW] === -1) { label[p + GW] = id; stack.push(p + GW) }
    }
    comps.push({ minx, miny, maxx, maxy, area, border })
  }

  // 房间筛选：排除贴边的室外背景；保留面积在合理区间的连通域
  const minArea = N * 0.0025
  const maxArea = N * 0.5
  const exterior = comps.slice().sort((a, b) => b.area - a.area)[0]
  let rooms = comps.filter((c) => c !== exterior && !c.border && c.area >= minArea && c.area <= maxArea)
  if (rooms.length === 0) {
    rooms = comps.filter((c) => c !== exterior && c.area >= minArea && c.area <= maxArea)
  }
  rooms.sort((a, b) => b.area - a.area)
  rooms = rooms.slice(0, 24)

  // 与编辑器底图绘制保持一致：底图被拉伸铺满 MAP_W×MAP_H，这里也按"拉伸"映射，
  // 保证识别出的房间与底图完全对齐（之前用等比居中导致错位）。
  const sx = MAP_W / GW
  const sy = MAP_H / GH

  const polys: Point[][] = []
  for (const c of rooms) {
    // 膨胀会让房间内缩，这里把外接矩形按膨胀量回扩，更贴合真实墙内尺寸
    const gx0 = Math.max(0, c.minx - DIL)
    const gy0 = Math.max(0, c.miny - DIL)
    const gx1 = Math.min(GW - 1, c.maxx + DIL)
    const gy1 = Math.min(GH - 1, c.maxy + DIL)
    const x = gx0 * sx + 3
    const y = gy0 * sy + 3
    const w = (gx1 - gx0 + 1) * sx - 6
    const h = (gy1 - gy0 + 1) * sy - 6
    if (w < 26 || h < 22) continue // 过小的可能是壁橱/误检，跳过
    polys.push([
      { x: Math.round(x), y: Math.round(y) },
      { x: Math.round(x + w), y: Math.round(y) },
      { x: Math.round(x + w), y: Math.round(y + h) },
      { x: Math.round(x), y: Math.round(y + h) },
    ])
  }
  return polys
}

function otsu(hist: number[], total: number): number {
  let sum = 0
  for (let t = 0; t < 256; t++) sum += t * hist[t]
  let sumB = 0, wB = 0, maxVar = -1, thr = 127
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const v = wB * wF * (mB - mF) * (mB - mF)
    if (v > maxVar) { maxVar = v; thr = t }
  }
  return thr
}

function dilate(mask: Uint8Array, GW: number, GH: number, iters: number): Uint8Array {
  let cur = mask
  for (let k = 0; k < iters; k++) {
    const nx = new Uint8Array(cur.length)
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = y * GW + x
        if (cur[i]) { nx[i] = 1; continue }
        if ((x > 0 && cur[i - 1]) || (x < GW - 1 && cur[i + 1]) || (y > 0 && cur[i - GW]) || (y < GH - 1 && cur[i + GW])) nx[i] = 1
      }
    }
    cur = nx
  }
  return cur
}

function loadImage(src: string): Promise<HTMLImageElement> {  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
