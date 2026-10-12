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
  await page.getByTestId('nav-map').click()
  await page.getByTestId('edit-map-btn').click()
  await expect(page.getByTestId('map-builder-modal')).toBeVisible()
  await page.getByRole('button', { name: '上传户型' }).click()
  await page.getByTestId('upload-floorplan-input').setInputFiles({ name: path.basename(file!), mimeType: mime, buffer: buf })

  // 等待自动识别完成（进入手绘页 / 列出房间）
  await page.waitForTimeout(2500)
  const count = await page.getByTestId('room-row').count()
  // eslint-disable-next-line no-console
  console.log(`\n[floorplan-tune] 识别到房间数 = ${count}\n`)

  const canvas = page.getByTestId('editor-canvas')
  if (await canvas.count()) {
    await canvas.first().screenshot({ path: path.join(FIX, '_detect-result.png') })
    // eslint-disable-next-line no-console
    console.log(`[floorplan-tune] 已保存叠加截图 -> e2e/fixtures/_detect-result.png`)
  }

  // 不做硬断言，这是人工调参诊断用例
  expect(count).toBeGreaterThanOrEqual(0)
})
