const { app, BrowserWindow, ipcMain, globalShortcut, Menu } = require('electron');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { join } = require('path');
ffmpeg.setFfmpegPath(ffmpegPath);

Menu.setApplicationMenu(null);

/** @type {BrowserWindow} */ let browserWindow = null;
app.whenReady().then(async () => {
    app.on('browser-window-focus', () => globalShortcut.register("CommandOrControl+R", () => { app.relaunch(); app.exit(); }));
    app.on('browser-window-blur', () => globalShortcut.unregister("CommandOrControl+R"));

    createWindow();

    app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

    ipcMain.handle('download', async (_, link, output) => {
        await new Promise((resolve, reject) => ffmpeg(
            ytdl(link, { quality: 'highestaudio', filter: 'audioonly' })
        )
            .audioCodec('libmp3lame')
            .format('mp3')
            .save(output)
            .on('end', () => { resolve(); })
            .on('error', (err) => { reject(err); })
        );
    });
});

async function createWindow() {
    browserWindow = new BrowserWindow({
        x: 0, y: 0, width: 900, height: 600,
        webPreferences: { preload: join(__dirname, 'preload.js') }
    })
    browserWindow.on('closed', () => { browserWindow = null });
    browserWindow.on('focus', () => globalShortcut.register('F11',
        () => browserWindow.setFullScreen(!browserWindow.isFullScreen())
    ));
    browserWindow.on('blur', () => globalShortcut.unregisterAll());
    browserWindow.webContents.openDevTools();

    await browserWindow.loadFile(join(__dirname, 'index.html'));
}
