const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { startSimDataServer } = require('../server/bioServer.cjs');

let mainWindow = null;
let bioBridge = null;

function createWindow() {
  // Start the background BioEngine WebSocket (:8080) & OSC UDP (:9000) server
  try {
    bioBridge = startSimDataServer({ wsPort: 8080, oscPort: 9000 });
  } catch (err) {
    console.error('[SimData] Failed to start internal bridge server:', err);
  }

  mainWindow = new BrowserWindow({
    width: 1060,
    height: 760,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#080b12',
    title: 'SimData — Biofeedback & Neurofeedback Simulator & Bridge',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const devUrl = 'http://localhost:5173';
  const prodPath = path.join(__dirname, '..', 'dist', 'index.html');

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(prodPath);
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Automated test hook: cleanly exit after window loads
  if (process.argv.includes('--test') || process.env.ELECTRON_TEST) {
    mainWindow.webContents.once('did-finish-load', () => {
      console.log('[SimData Electron] Test mode: Desktop window loaded dist/index.html successfully.');
      setTimeout(() => {
        if (mainWindow) mainWindow.close();
        app.quit();
      }, 500);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (bioBridge) {
    try {
      bioBridge.stop();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

