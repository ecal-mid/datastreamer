const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('simDataDesktop', {
  isElectron: true,
  platform: process.platform,
  openRecordingsFolder: () => ipcRenderer.invoke('open-recordings-folder'),
  openPlaylistsFolder: () => ipcRenderer.invoke('open-playlists-folder'),
});

contextBridge.exposeInMainWorld('simBioDesktop', {
  isElectron: true,
  platform: process.platform,
  openRecordingsFolder: () => ipcRenderer.invoke('open-recordings-folder'),
  openPlaylistsFolder: () => ipcRenderer.invoke('open-playlists-folder'),
});

