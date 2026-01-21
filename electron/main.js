const { app, BrowserWindow, nativeImage, session, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { registerGithubCopilotIpc } = require('./ipc/githubCopilotIpc');

let backendProcess = null;

function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) return; // In dev, backend is started manually or via concurrently

  const binaryName = process.platform === 'win32' ? 'AzureAISearchExplorer.Backend.exe' : 'AzureAISearchExplorer.Backend';
  // In production, extraResources places the backend folder in resources/backend
  const backendPath = path.join(process.resourcesPath, 'backend', binaryName);

  backendProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    env: { ...process.env, ASPNETCORE_URLS: 'http://localhost:5368' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });
}

function configureCorsBypass() {
  const filter = {
    urls: ['https://*.search.windows.net/*', 'https://*.search.azure.com/*', 'https://github.com/*', 'https://*.github.com/*', 'https://*.githubusercontent.com/*', 'https://*.githubcopilot.com/*']
  };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const headers = details.responseHeaders || {};
    headers['Access-Control-Allow-Origin'] = ['*'];
    headers['Access-Control-Allow-Methods'] = ['GET, POST, PUT, PATCH, DELETE, OPTIONS'];
    headers['Access-Control-Allow-Headers'] = ['*'];
    callback({ responseHeaders: headers });
  });
}

function createWindow() {
  const svgPath = path.join(__dirname, 'renderer', 'vite.svg');
  const icon = nativeImage.createFromPath(svgPath);
  const windowOptions = {
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  };

  if (!icon.isEmpty()) {
    windowOptions.icon = icon;
  }

  const win = new BrowserWindow(windowOptions);

  // In development, load the Vite dev server URL
  // In production, load the built index.html
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // In production, we expect the frontend build to be copied to 'renderer' folder
    win.loadFile(path.join(__dirname, 'renderer/index.html'));
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.azureaisearchexplorer.app');
  }
  ipcMain.handle('open-external', async (_event, url) => {
    if (typeof url !== 'string' || url.trim().length === 0) return;
    await shell.openExternal(url);
  });
  registerGithubCopilotIpc();
  configureCorsBypass();
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
