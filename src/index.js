const { app, BrowserWindow, ipcMain, globalShortcut, Menu, dialog, shell } = require('electron');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

if (require('electron-squirrel-startup')) app.quit();

ffmpeg.setFfmpegPath(ffmpegStatic);
Menu.setApplicationMenu(null);
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';

/** @type {BrowserWindow} */ let browserWindow = null;
async function createWindow() {
  browserWindow = new BrowserWindow({
    width: 600, height: 400,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  if (isDevelopment) {
    browserWindow.setPosition(0, 0);
    browserWindow.setSize(900, 900);
    browserWindow.webContents.openDevTools();
  }

  browserWindow.on('closed', () => { browserWindow = null; });
  browserWindow.on('focus', () => globalShortcut.register('F11',
    () => browserWindow.setFullScreen(!browserWindow.isFullScreen())
  ));
  browserWindow.on('blur', () => globalShortcut.unregisterAll());
  browserWindow.webContents.on('did-finish-load', () => { browserWindow.show(); });

  const handleLink = (event, url) => { event.preventDefault(); shell.openExternal(url); };
  browserWindow.webContents.on('new-window', handleLink);
  browserWindow.webContents.on('will-navigate', handleLink);
  browserWindow.webContents.on('will-redirect', handleLink);
  browserWindow.webContents.on('will-frame-navigate', handleLink);

  await browserWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

  app.on('browser-window-focus', () => globalShortcut.register("CommandOrControl+R", () => { app.relaunch(); app.exit(); }));
  app.on('browser-window-blur', () => globalShortcut.unregister("CommandOrControl+R"));

  ipcMain.handle('title', async (_, link) => {
    const info = await ytdl.getInfo(link);
    return info.videoDetails.title;
  });

  ipcMain.handle('location', async (_, defaultPath) => {
    const response = await dialog.showSaveDialog({
      title: 'Export',
      defaultPath,
      filters: [{
        name: 'MP3 Files',
        extensions: ['mp3']
      }]
    });
    return response.filePath;
  });

  ipcMain.handle('start', async (_, link, output) => {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(ytdl(link, { quality: 'highestaudio', filter: 'audioonly' }))
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('end', () => { resolve(); })
        .on('error', (err) => { reject(err); })
        .save(output);
    });
    return path.dirname(output)
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
