const { app, BrowserWindow, ipcMain, globalShortcut, Menu, shell, screen, clipboard, dialog } = require('electron');
const { dirname, join, parse } = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { existsSync, accessSync, statSync } = require('fs');
const { unlink, readdir } = require('fs/promises');

if (require('electron-squirrel-startup')) app.quit();
ffmpeg.setFfmpegPath(ffmpegStatic);
Menu.setApplicationMenu(null);

/** @type {BrowserWindow} */
let window = null;
const isDevelopment = !app.isPackaged || process.env.NODE_ENV === 'development';
const lock = initLock();
const destination = initDestination();

app.whenReady().then(initApp).then(debug);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

function initApp() {
  createWindow();
  window.on('close', e => { if (!lock.confirm()) e.preventDefault(); });

  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
  app.on('browser-window-focus', () => {
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
  });
  app.on('browser-window-blur', () => {
    globalShortcut.unregister("F5");
    globalShortcut.unregister("CommandOrControl+R");
    globalShortcut.unregister("F11");
  });
  app.on('before-quit', e => {
    e.preventDefault();
    lock.clean().finally(app.exit);
  });

  ipcMain.handle('info', async (_, link) => {
    const info = await ytdl.getInfo(link);
    return {
      url: info.videoDetails.video_url,
      title: info.videoDetails.title
    }
  });
  ipcMain.handle('folder', destination.prompt);
  ipcMain.handle('start', startEventHandler);
}

async function createWindow() {
  window = new BrowserWindow({
    width: 600, height: 400,
    icon: join(__dirname, 'icon.ico'),
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  });

  window.on('closed', () => { window = null; });
  window.webContents.on('did-finish-load', () => { window.show(); });

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
  window.webContents.on('new-window', handleLink);
  window.webContents.on('will-navigate', handleLink);
  window.webContents.on('will-redirect', handleLink);
  window.webContents.on('will-frame-navigate', handleLink);

  window.webContents.on('context-menu', (_, event) => {
    const click = () => clipboard.writeText(event.selectionText || event.linkURL);
    Menu.buildFromTemplate([
      { role: 'cut' },
      { label: 'Copy', click },
      { role: 'paste' },
      { role: 'delete' }
    ]).popup(window);
  });

  await window.loadFile(join(__dirname, 'index.html'));
}

async function startEventHandler(_, id, link, title) {
  const channel = `kill-${id}`;
  /** @type {ffmpeg.FfmpegCommand|undefined} */
  let command, output, aborted = false, resolveKill;
  const listener = () => { command?.kill(); aborted = true; };
  const killPromise = new Promise(f => resolveKill = f);
  const killCallback = () => {
    aborted = true;
    if (!command) return;
    command?.kill();
    return killPromise;
  };
  try {
    ipcMain.once(channel, listener);

    const info = await ytdl.getInfo(link);
    if (aborted) return;

    const format = ytdl.chooseFormat(info.formats,
      { quality: 'highestaudio', filter: 'audioonly' }
    );
    const length = (x => x > 0 ? x : null)(Number(format.contentLength));

    command = ffmpeg(ytdl.downloadFromInfo(info, { format }));
    const file = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    output = uniquePath(join(await destination.get(), `${file}.mp3`));
    lock.inc(output, killCallback);

    await new Promise((resolve, reject) => command
      .format('mp3')
      .on('progress', x => {
        if (!length) return;
        const percent = x.targetSize * 1000 / length;
        window?.webContents.send(`progress-${id}`, percent);
      })
      .on('end', () => { resolve(); })
      .on('error', err => setTimeout(() => unlink(output)
        .finally(() => { reject(err); resolveKill(); })
      ))
      .save(output)
    );
    return output;
  } catch (error) {
    const sigkill = 'ffmpeg was killed with signal SIGKILL'
    if (error?.message === sigkill) return { error: 'cancel' };
    throw error;
  } finally {
    lock.dec(output, killCallback);
    ipcMain.removeListener(channel, listener);
    command?.kill();
  }
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

function uniquePath(path) {
  const { dir, name, ext } = parse(path);
  const [, main = name, digits] = name.match(/^(.+)\s\((\d+)\)/) ?? [];
  let count = parseInt(digits ?? 0);

  while (lock.count(path) || existsSync(path))
    path = join(dir, `${main} (${++count})${ext}`);

  return path;
}

function initLock() {
  /** @type {Map<string, Set<() => Promise>>} */
  const _ = new Map();
  const get = k => _.get(k);
  const has = k => _.has(k);
  const set = (k, v) => _.set(k, v);
  const count = k => get(k)?.size ?? 0;
  const inc = (k, f) => { if (!has(k)) set(k, new Set()); get(k).add(f); };
  const dec = (k, v) => {
    if (!has(k)) return;
    const killSet = get(k);
    if (!killSet.has(v)) return;
    killSet.delete(v);
    if (!killSet.size) _.delete(k);
  };
  const callbacks = () => Array.from(_.values()).flatMap(s => Array.from(s.values()))
  const clean = () => Promise.all(callbacks().map(f => f()));
  const confirm = () => {
    if (!callbacks().length) return true;
    const choice = dialog.showMessageBoxSync(window, {
      type: 'warning',
      buttons: ['Yes', 'No'],
      title: 'Exit',
      message: 'Are you sure you want to exit? This will cancel any ongoing downloads.'
    });
    return choice === 0;
  };
  return { count, inc, dec, clean, confirm };
}

function initDestination() {
  const fallback = app.getPath('downloads');
  const id = 'destination';
  let _, store;
  const set = path => { store.set(id, _ = path); return _; };
  const init = async () => {
    if (!store) store = new (await import('electron-store')).default()
    const storedData = store.get(id);
    return set(isValid(storedData) ? storedData : fallback);
  };
  const isValid = path => {
    if (!path) return false;
    try {
      accessSync(path);
      return statSync(path).isDirectory();
    } catch (err) {
      return false;
    }
  }
  const prompt = async () => {
    if (!_) await init();
    const response = await dialog.showOpenDialog({
      title: 'Select Download Folder',
      defaultPath: isValid(_) ? _ : await init(),
      properties: ['openDirectory']
    });
    const choice = response.filePaths[0];
    if (isValid(choice)) set(choice);
    return _;
  };
  const get = async () => {
    if (!_) return await init();
    if (!isValid(_)) return set(fallback);
    return _;
  };
  return { get, prompt };
}
