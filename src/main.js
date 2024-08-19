const { app, BrowserWindow, ipcMain, globalShortcut, Menu, screen } = require('electron');
const { join } = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { unlink, readdir } = require('fs/promises');
const Lock = require('./components/lock.js');
const Destination = require('./components/destination.js');
const Window = require('./components/window.js');
const Download = require('./components/download.js')

if (require('electron-squirrel-startup')) app.quit();
ffmpeg.setFfmpegPath(ffmpegStatic);
Menu.setApplicationMenu(null);

/** @type {BrowserWindow} */
let window = null;
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';
const lock = Lock();
const destination = Destination();

app.whenReady().then(initApp).then(debug);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

function initApp() {
  window = Window();
  window.on('closed', () => { window = null; });
  window.on('close', e => { if (!lock.confirm()) e.preventDefault(); });

  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) Window(); });
  app.on('browser-window-focus', registerShortcuts);
  app.on('browser-window-blur', unregisterShortcuts);
  app.on('before-quit', e => { e.preventDefault(); lock.clean().finally(app.exit); });

  ipcMain.handle('info', async (_, link) => {
    const info = await ytdl.getInfo(link);
    return {
      url: info.videoDetails.video_url,
      title: info.videoDetails.title
    }
  });
  ipcMain.handle('folder', destination.prompt);
  ipcMain.handle('download', Download(window, lock, destination));
}

function registerShortcuts() {
  const restart = async () => {
    if (!lock.confirm()) return;
    lock.clean().finally(() => {
      app.relaunch(); app.exit();
    });
  }
  globalShortcut.register("F5", restart);
  globalShortcut.register("CommandOrControl+R", restart);
  globalShortcut.register("F11", () =>
    window.setFullScreen(!window.isFullScreen())
  );
}

function unregisterShortcuts() {
  globalShortcut.unregister("F5");
  globalShortcut.unregister("CommandOrControl+R");
  globalShortcut.unregister("F11");
}

async function debug() {
  if (!isDevelopment) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  window.setPosition(0, 0);
  window.setSize(parseInt(width / 2), parseInt(height * 2 / 3));
  window.webContents.openDevTools();

  try {
    const dir = app.getPath('downloads');
    const files = await readdir(dir);
    const title = 'Gypsy Woman Shes Homeless La Da Dee La Da Da Basement Boy Strip To The Bone Mix';
    await Promise.allSettled(files
      .filter(file => file.startsWith(title) && file.endsWith('.mp3'))
      .map(file => unlink(join(dir, file)))
    );
  } finally {
    await window.webContents.executeJavaScript(`(${async () => {
      document.querySelector('input').value = 'https://www.youtube.com/watch?v=NqThf-MpCjs';
      document.querySelector('form').requestSubmit();
    }})()`);
  }
}
