const { app, BrowserWindow, dialog, shell } = require('electron');
const { spawn } = require('node:child_process');
const { createServer } = require('node:net');
const { join } = require('node:path');

let server;

function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error('Le serveur local s’est arrêté.');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Le serveur local ne répond pas.');
}

async function start() {
  const port = await availablePort();
  const url = `http://127.0.0.1:${port}`;
  const webDirectory = app.isPackaged
    ? join(process.resourcesPath, 'web')
    : join(__dirname, '..', '.next', 'standalone');
  const serverFile = join(webDirectory, 'server.js');

  server = spawn(process.execPath, [serverFile], {
    cwd: webDirectory,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
    },
    windowsHide: true,
    stdio: 'ignore',
  });

  await waitForServer(url, server);
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Gestion SV',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('https://')) shell.openExternal(target);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, target) => {
    if (!target.startsWith(url + '/')) {
      event.preventDefault();
      if (target.startsWith('https://')) shell.openExternal(target);
    }
  });
  await window.loadURL(url);
}

app.whenReady().then(start).catch((error) => {
  dialog.showErrorBox('Gestion SV', `Impossible de démarrer l’application.\n\n${error.message}`);
  app.quit();
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => {
  if (server && server.exitCode === null) server.kill();
});
