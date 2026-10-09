// PetLink 桌面组件（Electron 主进程）：无边框 + 置顶 + 透明的小窗，内容为浮窗迷你地图(?mini=1)
const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let win = null

function createWindow() {
  const { workAreaSize } = screen.getPrimaryDisplay()
  const width = 480
  const height = 360
  win = new BrowserWindow({
    width,
    height,
    minWidth: 320,
    minHeight: 240,
    // 停靠在屏幕右下角
    x: workAreaSize.width - width - 24,
    y: workAreaSize.height - height - 24,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: false,
    title: 'PetLink 桌面组件',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  // 置顶到悬浮层级（在多数全屏/普通窗口之上）
  win.setAlwaysOnTop(true, 'floating')

  const devUrl = process.env.ELECTRON_START_URL
  if (devUrl) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { query: { mini: '1' } })
  }

  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

// 渲染进程可请求关闭 / 置顶切换
ipcMain.on('mini:close', () => win && win.close())
ipcMain.on('mini:toggle-top', () => {
  if (!win) return
  const next = !win.isAlwaysOnTop()
  win.setAlwaysOnTop(next, 'floating')
})
