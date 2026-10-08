import { test, expect, type Page } from '@playwright/test'

async function gotoFresh(page: Page) {
  // 每个测试用例是独立 context，localStorage 本身为空；不在此清理，以免影响 reload 后的持久化断言
  await page.goto('/')
  await expect(page.getByTestId('nav-home')).toBeVisible()
}

test('首页加载并显示守护对象', async ({ page }) => {
  await gotoFresh(page)
  await expect(page.getByText('今日守护对象')).toBeVisible()
})

test('地图页显示实时追踪卡与客厅', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await expect(page.getByTestId('tracking-card')).toBeVisible()
  await expect(page.getByTestId('tracking-room')).toHaveText('客厅')
})

test('编辑已有房间加顶点 + 新增房间 + 应用 + 刷新持久化', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('edit-map-btn').click()
  await expect(page.getByTestId('map-builder-modal')).toBeVisible()

  // 选中已有第一个房间 → 出现单房间编辑器 → 加转角
  await page.getByTestId('room-row').first().click()
  await expect(page.getByTestId('room-inspector')).toBeVisible()
  await page.getByTestId('add-vertex').click()

  // 新增房间并重命名
  await page.getByRole('button', { name: '＋ 房间' }).first().click()
  const nameInputs = page.locator('[data-testid="room-row"] input')
  await nameInputs.last().fill('宠物房')

  // 应用到实时地图
  await page.getByTestId('apply-map').click()
  await expect(page.getByTestId('map-builder-modal')).toBeHidden()
  // 地图上出现新房间标签
  await expect(page.getByTestId('live-map-svg')).toContainText('宠物房')

  // 刷新后仍保留“宠物房”
  await page.reload()
  await page.getByTestId('nav-map').click()
  await expect(page.getByTestId('live-map-svg')).toContainText('宠物房')
})

test('模拟跨房间：位置更新 + 接力 + 追踪卡变化', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await expect(page.getByTestId('tracking-room')).toHaveText('客厅')
  await page.getByTestId('sim-next-room').click()
  // 位置应变化（不再是客厅）
  await expect(page.getByTestId('tracking-room')).not.toHaveText('客厅', { timeout: 5000 })
})

test('环境联动：高温出现建议卡并可确认开空调', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('demo-btn').click()
  await expect(page.getByTestId('demo-panel')).toBeVisible()
  // 当前房间(客厅)设为高温
  await page.getByRole('button', { name: '高温' }).click()
  // 关闭演示面板，避免遮挡建议卡按钮
  await page.getByTestId('demo-btn').click()
  await expect(page.getByTestId('demo-panel')).toBeHidden()
  await expect(page.getByTestId('suggestion-card')).toBeVisible()
  await page.getByTestId('suggestion-card').getByRole('button', { name: '开启空调' }).click()
  await expect(page.getByTestId('toast')).toContainText('空调')
})

test('虚拟围栏同步当前地图版本并可保存', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-me').click()
  await page.getByRole('button', { name: /虚拟栅栏/ }).click()
  await expect(page.getByTestId('fence-modal')).toBeVisible()
  await expect(page.getByTestId('fence-sync-badge')).toContainText('房间')
  await page.getByTestId('save-fence').click()
  await expect(page.getByTestId('toast')).toContainText('虚拟栅栏已保存')
})

test('铃铛找人进入对话框并可发送 + 立即看它', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-me').click()
  await page.getByRole('button', { name: /宠物对话框/ }).click()
  await expect(page.getByTestId('chat-modal')).toBeVisible()
  await page.getByTestId('bell-btn').click()
  await expect(page.getByTestId('bell-event').last()).toBeVisible()
  await page.getByTestId('chat-input').fill('毛球我马上回家')
  await page.getByTestId('chat-send').click()
  await expect(page.getByTestId('observe-after-send')).toBeVisible({ timeout: 3000 })
  await page.getByTestId('observe-after-send').getByRole('button').click()
  await expect(page.getByTestId('camera-modal')).toBeVisible()
})

test('历史模式绘制轨迹', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('map-mode-history').click()
  await expect(page.getByText('今日停留热点')).toBeVisible()
})

test('情绪陪伴：开启后可触发温和提醒，非诊断', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-records').click()
  await page.getByTestId('companion-toggle').click()
  await page.getByTestId('low-mood-btn').click()
  await expect(page.getByTestId('emotion-push')).toBeVisible()
  await expect(page.getByTestId('emotion-signal')).toContainText('不作健康判断')
})

test('多宠物：切换宠物后追踪卡随之更新', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await expect(page.getByTestId('pet-switcher')).toBeVisible()
  await expect(page.getByTestId('tracking-room')).toHaveText('客厅')
  // 切到第二只（团子 · 卧室）
  await page.getByTestId('pet-switcher').getByRole('button', { name: '团子' }).click()
  await expect(page.getByTestId('tracking-room')).toHaveText('卧室')
})

test('点击 Avatar 弹出快捷互动气泡（核心交互）', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('pet-avatar').click({ force: true })
  await expect(page.getByTestId('avatar-popover')).toBeVisible()
  await expect(page.getByTestId('avatar-popover')).toContainText('看看它')
})

test('户型编辑器可布置家具（添加后可删除）', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('edit-map-btn').click()
  await page.getByTestId('room-row').first().click()
  await page.getByTestId('tool-furniture').click()
  await page.getByRole('button', { name: '＋ 沙发' }).click()
  // 新增家具会被选中 → 出现删除按钮
  await expect(page.getByTestId('furn-delete')).toBeVisible()
})

test('账号入口可打开账号与云端同步弹层', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('account-btn').click()
  await expect(page.getByTestId('auth-modal')).toBeVisible()
  // 视是否配置 Supabase：显示登录表单 或 本地模式提示，二者其一即通过
  await expect(page.getByTestId('auth-modal')).toContainText(/账号与云端同步/)
  const cloud = await page.getByTestId('auth-email').count()
  const local = await page.getByTestId('auth-modal').getByText('云端未配置').count()
  expect(cloud + local).toBeGreaterThan(0)
})

test('双击地图摄像头图标打开可观看浮窗并可关闭', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('live-map-svg').waitFor()
  await page.getByTestId('map-camera').first().dblclick({ force: true })
  await expect(page.getByTestId('camera-float')).toBeVisible()
  await page.getByTestId('camera-float-close').click()
  await expect(page.getByTestId('camera-float')).toBeHidden()
})

test('宠物气泡“看看它”复用同一摄像头浮窗（看最近摄像头）', async ({ page }) => {
  await gotoFresh(page)
  await page.getByTestId('nav-map').click()
  await page.getByTestId('pet-avatar').click({ force: true })
  await expect(page.getByTestId('avatar-popover')).toBeVisible()
  await page.getByTestId('avatar-popover').getByRole('button', { name: /看看它/ }).click()
  await expect(page.getByTestId('camera-float')).toBeVisible()
  await expect(page.getByTestId('camera-float')).toHaveCount(1)
})
