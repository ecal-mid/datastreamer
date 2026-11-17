const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('simDataDesktop', {
  isElectron: true,
  platform: process.platform,
  openRecordingsFolder: () => ipcRenderer.invoke('open-recordings-folder'),
});

contextBridge.exposeInMainWorld('simBioDesktop', {
  isElectron: true,
  platform: process.platform,
  openRecordingsFolder: () => ipcRenderer.invoke('open-recordings-folder'),
});

