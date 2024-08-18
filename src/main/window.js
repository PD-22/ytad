const { BrowserWindow, Menu, shell, clipboard } = require('electron');
const { dirname, join } = require('path');
const { existsSync } = require('fs');

module.exports = async () => {
  const window = new BrowserWindow({
    width: 600, height: 400,
    icon: join(__dirname, 'icon.ico'),
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload.js')
    }
  });

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

  await window.loadFile(join(__dirname, '../index.html'));

  return window;
}