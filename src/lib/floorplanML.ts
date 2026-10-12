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

// 资源前缀：Web 构建为 '/'，Electron 构建为 './'（file:// 相对加载），两端都能取到模型与 wasm
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
const MODEL_URL = `${BASE}models/floorplan.int8.onnx`
const S = 512
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]

let sessionP: Promise<ort.InferenceSession> | null = null

function getSession(): Promise<ort.InferenceSession> {
  if (!sessionP) {
    ort.env.wasm.wasmPaths = `${BASE}ort/`
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

type WallMask = { wall: Uint8Array; left: number; top: number; iw: number; ih: number }

/** 跑模型得到墙屏障掩码(墙|门|窗)，512 letterbox 空间，inner 区域对应整张原图。 */
async function runWallMask(dataUrl: string): Promise<WallMask> {
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
  const out = await session.run({ [session.inputNames[0]]: tensor })
  const logits = out[session.outputNames[0]].data as Float32Array // (1,4,512,512)

  // argmax → 墙屏障掩码(墙|门|窗)。
  const wall = new Uint8Array(plane)
  for (let i = 0; i < plane; i++) {
    let best = 0, bv = logits[i]
    for (let k = 1; k < 4; k++) { const v = logits[k * plane + i]; if (v > bv) { bv = v; best = k } }
    if (best >= 1) wall[i] = 1
  }
  closeMask(wall, S, S, 2) // 封住发丝级断口
  return { wall, left, top, iw, ih }
}

/**
 * 识别墙体并生成"墙体参考层"图：把模型识别到的墙(已去除家具/文字/标注/水印)画成
 * 半透明高亮层，尺寸与原图等比，叠在编辑器底图上供用户照着快速框选房间。
 * 返回 PNG dataURL 及其像素宽高(= letterbox inner 尺寸，等比于原图)。
 */
export async function detectWallsOverlay(dataUrl: string): Promise<{ url: string; width: number; height: number }> {
  const { wall, left, top, iw, ih } = await runWallMask(dataUrl)
  const c = document.createElement('canvas')
  c.width = iw
  c.height = ih
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('no 2d ctx')
  const im = ctx.createImageData(iw, ih)
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const src = (top + y) * S + (left + x)
      const di = (y * iw + x) * 4
      if (wall[src]) {
        im.data[di] = 22; im.data[di + 1] = 125; im.data[di + 2] = 109; im.data[di + 3] = 235 // 墨绿墙线
      } else {
        im.data[di + 3] = 0 // 透明
      }
    }
  }
  ctx.putImageData(im, 0, 0)
  return { url: c.toDataURL('image/png'), width: iw, height: ih }
}

export async function detectRoomsML(dataUrl: string): Promise<Point[][]> {
  const { wall, left, top, iw, ih } = await runWallMask(dataUrl)
  if ((globalThis as unknown as { __FP_DEBUG?: boolean }).__FP_DEBUG) {
    let wc = 0; for (let i = 0; i < wall.length; i++) wc += wall[i]
    ;(globalThis as unknown as { __FP_MLWALL?: unknown }).__FP_MLWALL = { S, wall, left, top, iw, ih }
    // eslint-disable-next-line no-console
    console.log(`[FP] ML wall px=${wc} inner=${iw}x${ih} left=${left} top=${top}`)
  }
  return extractRooms(wall, left, top, iw, ih)
}

/**
 * 从干净的墙掩码里提取房间矩形。模型墙里没有家具，所以用"矩形生长"：以地面点为种子，
 * 向四周扩张，直到某条边多半是墙(撞上贯穿墙)或越界才停。墙线上的小断口/门洞只占边线
 * 一小段，不会使生长停下，于是矩形严格以墙为界、能跨过门洞缺口与家具，得到完整房间。
 */
function extractRooms(wall: Uint8Array, left: number, top: number, iw: number, ih: number): Point[][] {
  // 封门洞：把墙膨胀一圈，桥接门口/墙线断口，让每个房间成为被墙完全围住的独立连通域。
  const SEAL = Math.max(3, Math.round(Math.min(iw, ih) / 90))
  const sealed = morph(wall, S, S, SEAL, true)
  const inWall = (x: number, y: number) => {
    if (x < left || y < top || x >= left + iw || y >= top + ih) return true
    return sealed[y * S + x] === 1
  }
  const label = new Int32Array(S * S).fill(-1)
  type Comp = { minx: number; miny: number; maxx: number; maxy: number; area: number; border: boolean }
  const comps: Comp[] = []
  const stack: number[] = []
  for (let yy = top; yy < top + ih; yy++) {
    for (let xx = left; xx < left + iw; xx++) {
      const s = yy * S + xx
      if (inWall(xx, yy) || label[s] !== -1) continue
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
  const minArea = innerArea * 0.006
  const maxArea = innerArea * 0.5
  const exterior = comps.slice().sort((a, b) => b.area - a.area)[0]
  let rooms = comps.filter((c) => c !== exterior && !c.border && c.area >= minArea && c.area <= maxArea)
  if (rooms.length === 0) rooms = comps.filter((c) => c !== exterior && c.area >= minArea && c.area <= maxArea)
  rooms.sort((a, b) => b.area - a.area)
  rooms = rooms.slice(0, 24)
  if ((globalThis as unknown as { __FP_DEBUG?: boolean }).__FP_DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`[FP] ML comps=${comps.length} seal=${SEAL} extArea=${exterior?.area} rooms=${rooms.length} top5=${comps.slice().sort((a,b)=>b.area-a.area).slice(0,5).map(c=>c.area).join(',')}`)
  }

  // 膨胀封门让房间内缩，回扩 SEAL 贴回真实墙内沿
  const sx = MAP_W / iw
  const sy = MAP_H / ih
  const polys: Point[][] = []
  for (const c of rooms) {
    const gx0 = Math.max(left, c.minx - SEAL), gy0 = Math.max(top, c.miny - SEAL)
    const gx1 = Math.min(left + iw - 1, c.maxx + SEAL), gy1 = Math.min(top + ih - 1, c.maxy + SEAL)
    const x = (gx0 - left) * sx + 3
    const y = (gy0 - top) * sy + 3
    const wpx = (gx1 - gx0 + 1) * sx - 6
    const hpx = (gy1 - gy0 + 1) * sy - 6
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
