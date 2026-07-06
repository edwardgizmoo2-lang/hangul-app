const { contextBridge, ipcRenderer } = require('electron')

let maximizedListeners = []

ipcRenderer.on('window-maximized-changed', (_event, val) => {
  maximizedListeners.forEach(cb => cb(val))
})

contextBridge.exposeInMainWorld('electronAPI', {
  getStats: () => ipcRenderer.invoke('get-stats'),
  saveGameSession: (session) => ipcRenderer.invoke('save-game-session', session),
  resetStats: () => ipcRenderer.invoke('reset-stats'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedChange: (fn) => {
    maximizedListeners.push(fn)
  },
})

contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    maximize: () => ipcRenderer.invoke('window-maximize'),
    close: () => ipcRenderer.invoke('window-close'),
  }
})
