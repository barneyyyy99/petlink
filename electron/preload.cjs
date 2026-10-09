// 预加载脚本：在 contextIsolation 下安全暴露极简桥接给渲染进程
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('petlinkDesktop', {
  isElectron: true,
  close: () => ipcRenderer.send('mini:close'),
  toggleAlwaysOnTop: () => ipcRenderer.send('mini:toggle-top'),
})
