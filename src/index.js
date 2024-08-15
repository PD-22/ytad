const { app, BrowserWindow, ipcMain, globalShortcut, Menu, shell, screen, clipboard } = require('electron');
const { dirname, join, parse } = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { existsSync } = require('fs');
const { unlink, readdir } = require('fs/promises');

if (require('electron-squirrel-startup')) app.quit();

ffmpeg.setFfmpegPath(ffmpegStatic);
Menu.setApplicationMenu(null);
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';

const lock = (() => {
  const map = new Map();
  const get = k => map.get(k) ?? 0;
  const set = (k, v) => map.set(k, v);
  const inc = k => set(k, get(k) + 1);
  const dec = k => set(k, get(k) - 1);
  return { get, inc, dec };
})();

/** @type {BrowserWindow} */ let browserWindow = null;
async function createWindow() {
  browserWindow = new BrowserWindow({
    width: 600, height: 400,
    icon: join(__dirname, 'icon.ico'),
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  browserWindow.on('closed', () => { browserWindow = null; });
  browserWindow.on('focus', () => globalShortcut.register('F11',
    () => browserWindow.setFullScreen(!browserWindow.isFullScreen())
  ));
  browserWindow.on('blur', () => globalShortcut.unregisterAll());
  browserWindow.webContents.on('did-finish-load', () => { browserWindow.show(); });

  const handleLink = (event, url) => {
    event.preventDefault();
    url = decodeURIComponent(url);
    if (url.startsWith('file:///')) {
      if (existsSync(url.replace(/^file:\/\/\//, ''))) {
        shell.showItemInFolder(url);
      } else {
        shell.openExternal(dirname(url));
      }
    } else {
      shell.openExternal(url);
    }
  };
  browserWindow.webContents.on('new-window', handleLink);
  browserWindow.webContents.on('will-navigate', handleLink);
  browserWindow.webContents.on('will-redirect', handleLink);
  browserWindow.webContents.on('will-frame-navigate', handleLink);

  browserWindow.webContents.on('context-menu', (_, event) => {
    const click = () => clipboard.writeText(event.selectionText || event.linkURL);
    Menu.buildFromTemplate([
      { role: 'cut' },
      { label: 'Copy', click },
      { role: 'paste' },
      { role: 'delete' }
    ]).popup(browserWindow);
  });

  await browserWindow.loadFile(join(__dirname, 'index.html'));
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
    return uniquePath(join(dir, `${file}.mp3`));
  });

  ipcMain.handle('start', async (_, id, link, output) => {
    const channel = `kill-${id}`;
    let command, aborted;
    const listener = () => { command?.kill(); aborted = true; };
    try {
      ipcMain.once(channel, listener);

      const info = await ytdl.getInfo(link);
      if (aborted) return console.log('command aborted');

      const format = ytdl.chooseFormat(info.formats,
        { quality: 'highestaudio', filter: 'audioonly' }
      );

      command = ffmpeg(ytdl.downloadFromInfo(info, { format }));
      output = uniquePath(output);
      lock.inc(output);

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
    } catch (err) {
      setTimeout(() => unlink(output).catch(err => {
        if (err.code === 'ENOENT') return;
        console.error('Delete file failed:', err);
      }));
      throw err;
    } finally {
      lock.dec(output);
      ipcMain.removeListener(channel, listener);
    }
  });
}).then(async () => {
  if (!isDevelopment) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  browserWindow.setPosition(0, 0);
  browserWindow.setSize(width / 2, height);
  browserWindow.webContents.openDevTools();

  try {
    const dir = app.getPath('downloads');
    const files = await readdir(dir);
    const title = 'Gypsy Woman Shes Homeless La Da Dee La Da Da Basement Boy Strip To The Bone Mix';
    await Promise.allSettled(files
      .filter(file => file.startsWith(title) && file.endsWith('.mp3'))
      .map(file => unlink(join(dir, file)))
    )
  } finally {
    browserWindow.webContents.executeJavaScript(`
      document.querySelector('input').value = 'https://youtube.com/watch?v=NqThf-MpCjs';
      document.querySelector('form').requestSubmit();
    `);
  }
});

function uniquePath(path) {
  const { dir, name, ext } = parse(path);
  const [, main = name, digits] = name.match(/^(.+)\s\((\d+)\)/) ?? [];
  let count = parseInt(digits ?? 0);

  while (lock.get(path) || existsSync(path))
    path = join(dir, `${main} (${++count})${ext}`);

  return path;
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
