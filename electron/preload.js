const { contextBridge, ipcRenderer } = require('electron')

ipcRenderer.on('window-maximized-changed', (_event, val) => {
  window.dispatchEvent(new CustomEvent('window-maximized-changed', { detail: val }))
})

const api = {
  getStats: () => ipcRenderer.invoke('get-stats'),
  saveGameSession: (session) => ipcRenderer.invoke('save-game-session', session),
  resetStats: () => ipcRenderer.invoke('reset-stats'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
}

contextBridge.exposeInMainWorld('electronAPI', api)
contextBridge.exposeInMainWorld('electron', { window: api })
