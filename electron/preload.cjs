const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('simDataDesktop', {
  isElectron: true,
  platform: process.platform,
});

contextBridge.exposeInMainWorld('simBioDesktop', {
  isElectron: true,
  platform: process.platform,
});

