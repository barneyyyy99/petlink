import * as ort from 'onnxruntime-web'
import { MAP_W, MAP_H } from '@/domain/geometry'
import type { Point } from '@/domain/types'

/**
 * 基于深度模型的户型房间识别（ResNet34-UNet，CubiCasa5K 训练，4 类：
 * 0=地面 1=墙 2=门 3=窗）。模型只学"墙/门/窗"的结构，天然忽略室内家具，
 * 因此按墙精确分房间。模型在浏览器本地用 onnxruntime-web(WASM) 推理，
 * 图片不出本机。模型/运行时都是同源静态资源，首次使用懒加载并缓存。
 *
 * 失败时抛错，调用方回退到启发式识别。
 */

const MODEL_URL = '/models/floorplan.int8.onnx'
const S = 512
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]

let sessionP: Promise<ort.InferenceSession> | null = null

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionP) {
    ort.env.wasm.wasmPaths = '/ort/'
    ort.env.wasm.numThreads = 1 // 单线程，免去跨源隔离(COOP/COEP)要求
    sessionP = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    }).catch((e) => {
      sessionP = null
      throw e
    })
  }
  return sessionP
}

/** 模型是否就绪（已缓存会话）。用于 UI 判断是否需要提示"首次下载模型"。 */
export function isMLReady(): boolean {
  return sessionP !== null
}

export async function detectRoomsML(dataUrl: string): Promise<Point[][]> {
  const img = await loadImage(dataUrl)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const scale = Math.min(S / w, S / h)
  const iw = Math.max(1, Math.round(w * scale))
  const ih = Math.max(1, Math.round(h * scale))
  const left = (S - iw) >> 1
  const top = (S - ih) >> 1

  // letterbox 到 512×512，留白用 ImageNet 均值色（归一化后=0，与训练一致）
  const c = document.createElement('canvas')
  c.width = S
  c.height = S
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('no 2d ctx')
  ctx.fillStyle = `rgb(${Math.round(MEAN[0] * 255)},${Math.round(MEAN[1] * 255)},${Math.round(MEAN[2] * 255)})`
  ctx.fillRect(0, 0, S, S)
  ctx.drawImage(img, left, top, iw, ih)
  const { data } = ctx.getImageData(0, 0, S, S)

  const plane = S * S
  const input = new Float32Array(3 * plane)
  for (let i = 0; i < plane; i++) {
    input[i] = (data[i * 4] / 255 - MEAN[0]) / STD[0]
    input[plane + i] = (data[i * 4 + 1] / 255 - MEAN[1]) / STD[1]
    input[2 * plane + i] = (data[i * 4 + 2] / 255 - MEAN[2]) / STD[2]
  }

  const session = await getSession()
  const tensor = new ort.Tensor('float32', input, [1, 3, S, S])
  const feeds: Record<string, ort.Tensor> = { [session.inputNames[0]]: tensor }
  const out = await session.run(feeds)
  const logits = out[session.outputNames[0]].data as Float32Array // (1,4,512,512)

  // argmax → 墙屏障掩码(墙|门)。门是墙上的开口，纳入屏障以封住房间。
  const wall = new Uint8Array(plane)
  for (let i = 0; i < plane; i++) {
    let best = 0, bv = logits[i]
    for (let k = 1; k < 4; k++) { const v = logits[k * plane + i]; if (v > bv) { bv = v; best = k } }
    if (best === 1 || best === 2) wall[i] = 1
  }
  closeMask(wall, S, S, 2) // 轻度闭运算封住发丝级缺口

  return extractRooms(wall, left, top, iw, ih)
}

/** 在 inner 区域内对"地面"做连通域，排除贴 inner 边的室外背景，返回房间矩形(地图坐标)。 */
function extractRooms(wall: Uint8Array, left: number, top: number, iw: number, ih: number): Point[][] {
  // inner 之外一律当墙，让室外背景单独成域并被排除
  const inWall = (x: number, y: number) => {
    if (x < left || y < top || x >= left + iw || y >= top + ih) return true
    return wall[y * S + x] === 1
  }
  const label = new Int32Array(S * S).fill(-1)
  type Comp = { minx: number; miny: number; maxx: number; maxy: number; area: number; border: boolean }
  const comps: Comp[] = []
  const stack: number[] = []
  for (let y0 = top; y0 < top + ih; y0++) {
    for (let x0 = left; x0 < left + iw; x0++) {
      const s = y0 * S + x0
      if (inWall(x0, y0) || label[s] !== -1) continue
      const id = comps.length
      stack.length = 0
      stack.push(s); label[s] = id
      let minx = S, miny = S, maxx = 0, maxy = 0, area = 0, border = false
      while (stack.length) {
        const p = stack.pop() as number
        const x = p % S, y = (p / S) | 0
        area++
        if (x < minx) minx = x; if (x > maxx) maxx = x
        if (y < miny) miny = y; if (y > maxy) maxy = y
        if (x <= left || y <= top || x >= left + iw - 1 || y >= top + ih - 1) border = true
        if (!inWall(x - 1, y) && label[p - 1] === -1) { label[p - 1] = id; stack.push(p - 1) }
        if (!inWall(x + 1, y) && label[p + 1] === -1) { label[p + 1] = id; stack.push(p + 1) }
        if (!inWall(x, y - 1) && label[p - S] === -1) { label[p - S] = id; stack.push(p - S) }
        if (!inWall(x, y + 1) && label[p + S] === -1) { label[p + S] = id; stack.push(p + S) }
      }
      comps.push({ minx, miny, maxx, maxy, area, border })
    }
  }

  const innerArea = iw * ih
  const minArea = innerArea * 0.004
  const maxArea = innerArea * 0.6
  let rooms = comps.filter((c) => !c.border && c.area >= minArea && c.area <= maxArea)
  if (rooms.length === 0) rooms = comps.filter((c) => c.area >= minArea && c.area <= maxArea)
  rooms.sort((a, b) => b.area - a.area)
  rooms = rooms.slice(0, 24)

  // inner 像素 → 地图坐标(底图在编辑器中拉伸铺满 MAP_W×MAP_H)
  const sx = MAP_W / iw
  const sy = MAP_H / ih
  const polys: Point[][] = []
  for (const c of rooms) {
    const x = (c.minx - left) * sx + 3
    const y = (c.miny - top) * sy + 3
    const wpx = (c.maxx - c.minx + 1) * sx - 6
    const hpx = (c.maxy - c.miny + 1) * sy - 6
    if (wpx < 20 || hpx < 18) continue
    polys.push([
      { x: Math.round(x), y: Math.round(y) },
      { x: Math.round(x + wpx), y: Math.round(y) },
      { x: Math.round(x + wpx), y: Math.round(y + hpx) },
      { x: Math.round(x), y: Math.round(y + hpx) },
    ])
  }
  return polys
}

function closeMask(mask: Uint8Array, GW: number, GH: number, iters: number): void {
  const dil = morph(mask, GW, GH, iters, true)
  const ero = morph(dil, GW, GH, iters, false)
  mask.set(ero)
}

function morph(mask: Uint8Array, GW: number, GH: number, iters: number, dilate: boolean): Uint8Array {
  let cur = mask
  for (let k = 0; k < iters; k++) {
    const nx = new Uint8Array(cur.length)
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = y * GW + x
        const nb = (x > 0 && cur[i - 1]) || (x < GW - 1 && cur[i + 1]) || (y > 0 && cur[i - GW]) || (y < GH - 1 && cur[i + GW])
        if (dilate) nx[i] = cur[i] || nb ? 1 : 0
        else {
          const edge = x === 0 || y === 0 || x === GW - 1 || y === GH - 1
          const allNb = (x > 0 ? cur[i - 1] : 1) && (x < GW - 1 ? cur[i + 1] : 1) && (y > 0 ? cur[i - GW] : 1) && (y < GH - 1 ? cur[i + GW] : 1)
          nx[i] = cur[i] && (edge || allNb) ? 1 : 0
        }
      }
    }
    cur = nx
  }
  return cur
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
