import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 户型识别调参专用诊断用例（不参与常规回归）。
 * 用法：把真实户型图保存为 e2e/fixtures/floorplan-real.png（或 .jpg），
 * 然后运行：  npx playwright test floorplan-tune
 * 它会：上传该图 → 自动识别 → 打印识别到的房间数 → 把带房间叠加的
 * 编辑器画布截图写到 e2e/fixtures/_detect-result.png 供人工核对对齐/完整性。
 * 若文件不存在则跳过（避免影响 CI）。
 */

const FIX = path.join(process.cwd(), 'e2e', 'fixtures')
const CANDIDATES = ['floorplan-real.png', 'floorplan-real.jpg', 'floorplan-real.jpeg', 'floorplan-real.webp']

function findFixture(): string | null {
  for (const name of CANDIDATES) {
    const p = path.join(FIX, name)
    if (fs.existsSync(p)) return p
  }
  return null
}

const gotoFresh = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')
}

test('户型识别调参：真实户型图识别结果诊断', async ({ page }) => {
  const file = findFixture()
  test.skip(!file, '未找到 e2e/fixtures/floorplan-real.(png|jpg)，跳过调参用例')
  const mime = file!.endsWith('.jpg') || file!.endsWith('.jpeg') ? 'image/jpeg' : file!.endsWith('.webp') ? 'image/webp' : 'image/png'
  const buf = fs.readFileSync(file!)

  await gotoFresh(page)
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('[FP]')) console.log(t) })
  await page.evaluate(() => { (globalThis as unknown as { __FP_DEBUG?: boolean }).__FP_DEBUG = true })
  await page.getByTestId('nav-map').click()
  await page.getByTestId('edit-map-btn').click()
  await expect(page.getByTestId('map-builder-modal')).toBeVisible()
  await page.getByRole('button', { name: '上传户型' }).click()
  await page.getByTestId('upload-floorplan-input').setInputFiles({ name: path.basename(file!), mimeType: mime, buffer: buf })

  // 等待自动识别完成（ML 模型首次需下载~24MB+推理，放宽到 60s）
  await expect.poll(async () => await page.getByTestId('room-row').count(), { timeout: 60000, intervals: [1000] }).toBeGreaterThan(0).catch(() => {})
  const count = await page.getByTestId('room-row').count()
  // eslint-disable-next-line no-console
  console.log(`\n[floorplan-tune] 识别到房间数 = ${count}\n`)

  const canvas = page.getByTestId('editor-canvas')
  if (await canvas.count()) {
    await canvas.first().screenshot({ path: path.join(FIX, '_detect-result.png') })
    // eslint-disable-next-line no-console
    console.log(`[floorplan-tune] 已保存叠加截图 -> e2e/fixtures/_detect-result.png`)
  }

  // 导出墙骨架/结构墙/最终墙三张掩码图，便于人工核对"墙识别"本身
  const masks = await page.evaluate(() => {
    const w = (globalThis as unknown as { __FP_WALL?: { GW: number; GH: number; wall: Uint8Array; struct: Uint8Array; skeleton: Uint8Array } }).__FP_WALL
    if (!w) return null
    const render = (m: Uint8Array) => {
      const c = document.createElement('canvas'); c.width = w.GW; c.height = w.GH
      const x = c.getContext('2d')!; const im = x.createImageData(w.GW, w.GH)
      for (let i = 0; i < m.length; i++) { const v = m[i] ? 0 : 255; im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255 }
      x.putImageData(im, 0, 0); return c.toDataURL('image/png')
    }
    return { skeleton: render(w.skeleton), struct: render(w.struct), wall: render(w.wall) }
  })
  if (masks) {
    for (const [k, url] of Object.entries(masks)) {
      const b = Buffer.from((url as string).split(',')[1], 'base64')
      fs.writeFileSync(path.join(FIX, `_mask-${k}.png`), b)
    }
    // eslint-disable-next-line no-console
    console.log(`[floorplan-tune] 已保存墙掩码 -> e2e/fixtures/_mask-{skeleton,struct,wall}.png`)
  }

  // 不做硬断言，这是人工调参诊断用例
  expect(count).toBeGreaterThanOrEqual(0)
})
