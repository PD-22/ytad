const { app, BrowserWindow, ipcMain, globalShortcut, Menu, dialog, shell } = require('electron');
const path = require('path');
const { createWriteStream } = require('fs');
const ytdl = require('@distube/ytdl-core');

if (require('electron-squirrel-startup')) app.quit();

Menu.setApplicationMenu(null);
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';

/** @type {BrowserWindow} */ let browserWindow = null;
async function createWindow() {
  browserWindow = new BrowserWindow({
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

  await browserWindow.loadFile(path.join(__dirname, 'index.html'));

  const handleLink = (event, url) => { event.preventDefault(); shell.openExternal(url); };
  browserWindow.webContents.on('new-window', handleLink);
  browserWindow.webContents.on('will-navigate', handleLink);
  browserWindow.webContents.on('will-redirect', handleLink);
  browserWindow.webContents.on('will-frame-navigate', handleLink);
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
        name: 'MP4 Files',
        extensions: ['mp4']
      }]
    });
    return response.filePath;
  });

  ipcMain.handle('start', async (_, link, output) => {
    await new Promise((resolve, reject) => ytdl(link, {
      quality: 'highestaudio', filter: 'audioonly'
    })
      .pipe(createWriteStream(output))
      .on('finish', () => { resolve(); })
      .on('error', (err) => { reject(err); })
    );
    return path.dirname(output)
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
