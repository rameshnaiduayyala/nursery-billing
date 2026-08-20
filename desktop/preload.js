const { contextBridge, ipcRenderer } = require('electron');

// Expose safe desktop IPC APIs to renderer window if needed
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  print: () => ipcRenderer.send('print-window'),
});
