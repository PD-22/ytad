const { app, BrowserWindow, ipcMain, globalShortcut, Menu, dialog, shell } = require('electron');
const ytdl = require('@distube/ytdl-core');
const { join } = require('path');
const { createWriteStream } = require('fs');
const path = require('path');

Menu.setApplicationMenu(null);

/** @type {BrowserWindow} */ let browserWindow = null;
app.whenReady().then(async () => {
    app.on('browser-window-focus', () => globalShortcut.register("CommandOrControl+R", () => { app.relaunch(); app.exit(); }));
    app.on('browser-window-blur', () => globalShortcut.unregister("CommandOrControl+R"));

    createWindow();

    app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

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
        return path.dirname(output);
    });
});

async function createWindow() {
    browserWindow = new BrowserWindow({
        x: 0, y: 0, width: 900, height: 900,
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        }
    })
    browserWindow.on('closed', () => { browserWindow = null });
    browserWindow.on('focus', () => globalShortcut.register('F11',
        () => browserWindow.setFullScreen(!browserWindow.isFullScreen())
    ));
    browserWindow.on('blur', () => globalShortcut.unregisterAll());
    browserWindow.webContents.openDevTools();

    await browserWindow.loadFile(join(__dirname, 'index.html'));

    const handleLink = (event, url) => { event.preventDefault(); shell.openExternal(url); };
    browserWindow.webContents.on('new-window', handleLink);
    browserWindow.webContents.on('will-navigate', handleLink);
    browserWindow.webContents.on('will-redirect', handleLink);
    browserWindow.webContents.on('will-frame-navigate', handleLink);
}
