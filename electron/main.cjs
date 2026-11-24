const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { startSimDataServer } = require('../server/bioServer.cjs');

let mainWindow = null;
let bioBridge = null;

function getRecordingsDir() {
  const userDataDir = app.getPath('userData');
  const recordingsDir = path.join(userDataDir, 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  // Seed default bundled recordings to user's writable recordings directory
  const bundledDir = path.join(__dirname, '..', 'assets', 'recordings');
  if (fs.existsSync(bundledDir)) {
    try {
      const defaultFiles = fs.readdirSync(bundledDir).filter(f => f.endsWith('.json') || f.endsWith('.csv'));
      for (const f of defaultFiles) {
        const src = path.join(bundledDir, f);
        const dst = path.join(recordingsDir, f);
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
        }
      }
    } catch (e) {
      console.warn('[SimData] Could not seed default recordings to userData:', e);
    }
  }

  return recordingsDir;
}

function getPlaylistsDir() {
  const userDataDir = app.getPath('userData');
  const playlistsDir = path.join(userDataDir, 'playlists');
  if (!fs.existsSync(playlistsDir)) {
    fs.mkdirSync(playlistsDir, { recursive: true });
  }

  // Seed default bundled playlists to user's writable playlists directory
  const bundledDir = path.join(__dirname, '..', 'assets', 'playlists');
  if (fs.existsSync(bundledDir)) {
    try {
      const defaultFiles = fs.readdirSync(bundledDir).filter(f => f.endsWith('.json'));
      for (const f of defaultFiles) {
        const src = path.join(bundledDir, f);
        const dst = path.join(playlistsDir, f);
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
        }
      }
    } catch (e) {
      console.warn('[SimData] Could not seed default playlists to userData:', e);
    }
  }

  return playlistsDir;
}

// Handle opening recordings folder in native file manager
ipcMain.handle('open-recordings-folder', async () => {
  const recDir = getRecordingsDir();
  await shell.openPath(recDir);
  return true;
});

// Handle opening playlists folder in native file manager
ipcMain.handle('open-playlists-folder', async () => {
  const plDir = getPlaylistsDir();
  await shell.openPath(plDir);
  return true;
});

function createWindow() {
  const wsPort = Number(process.env.PORT || process.env.WS_PORT) || 8081;
  const oscPort = Number(process.env.OSC_PORT) || 9000;
  const recordingsDir = getRecordingsDir();
  const playlistsDir = getPlaylistsDir();

  // Start the background BioEngine WebSocket & OSC UDP server
  try {
    bioBridge = startSimDataServer({ wsPort, oscPort, recordingsDir, playlistsDir });
  } catch (err) {
    console.error('[SimData] Failed to start internal bridge server:', err);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

