const { app, BrowserWindow, ipcMain, globalShortcut, Menu, shell } = require('electron');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { existsSync } = require('fs');

if (require('electron-squirrel-startup')) app.quit();

ffmpeg.setFfmpegPath(ffmpegStatic);
Menu.setApplicationMenu(null);
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';

/** @type {BrowserWindow} */ let browserWindow = null;
async function createWindow() {
  browserWindow = new BrowserWindow({
    width: 600, height: 400,
    icon: path.join(__dirname, 'icon.ico'),
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

  const handleLink = (event, url) => {
    event.preventDefault();
    if (/^file:\/\/\/.*\.mp3$/.test(url)) {
      shell.showItemInFolder(url);
    } else {
      shell.openExternal(url);
    }
  };
  browserWindow.webContents.on('new-window', handleLink);
  browserWindow.webContents.on('will-navigate', handleLink);
  browserWindow.webContents.on('will-redirect', handleLink);
  browserWindow.webContents.on('will-frame-navigate', handleLink);

  browserWindow.webContents.on('context-menu', (_) => {
    const roles = ['cut', 'copy', 'paste', 'delete'];
    const template = roles.map(role => ({ role }));
    Menu.buildFromTemplate(template).popup(browserWindow);
  });

  await browserWindow.loadFile(path.join(__dirname, 'index.html'));
  if (isDevelopment) await browserWindow.webContents.executeJavaScript(`
    document.querySelector('input').value = 'https://youtube.com/watch?v=NqThf-MpCjs';
    document.querySelector('form').requestSubmit();
  `);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

  app.on('browser-window-focus', () => {
    const reload = () => { app.relaunch(); app.exit(); };
    globalShortcut.register("F5", reload)
    globalShortcut.register("CommandOrControl+R", reload)
  });
  app.on('browser-window-blur', () => {
    globalShortcut.unregister("F5");
    globalShortcut.unregister("CommandOrControl+R");
  });

  ipcMain.handle('info', async (_, link) => {
    const info = await ytdl.getInfo(link);
    return {
      url: info.videoDetails.video_url,
      title: info.videoDetails.title
    }
  });

  ipcMain.handle('location', (_, title) => {
    const dir = app.getPath('downloads');
    const file = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    return uniquePath(path.join(dir, `${file}.mp3`));
  });

  ipcMain.handle('start', async (_, id, link, output) => {
    let command, aborted;
    const killListener = () => {
      command?.kill();
      aborted = true;
    };
    ipcMain.once(`kill-${id}`, killListener);

    try {
      const info = await ytdl.getInfo(link);
      if (aborted) return console.log('command aborted');

      const format = ytdl.chooseFormat(info.formats,
        { quality: 'highestaudio', filter: 'audioonly' }
      );

      command = ffmpeg(ytdl.downloadFromInfo(info, { format }));
      output = uniquePath(output);

      await new Promise((resolve, reject) => command
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('progress', x => {
          const percent = x.targetSize * 1000 / format.contentLength;
          browserWindow.webContents.send(`progress-${id}`, percent);
        })
        .on('end', () => { resolve(); })
        .on('error', err => { reject(err); })
        .save(output)
      );
      return output;
    } finally {
      ipcMain.removeListener(`kill-${id}`, killListener);
    }
  });
});

function uniquePath(filePath) {
  let counter = 1;
  const dirName = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const extension = path.extname(filePath);

  while (existsSync(filePath)) filePath = path
    .join(dirName, `${baseName} (${counter++})${extension}`);

  return filePath;
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
