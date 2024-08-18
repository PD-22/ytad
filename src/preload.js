const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    info: link => ipcRenderer.invoke('info', link),
    start: (id, link, title) => ipcRenderer.invoke('start', id, link, title),
    onProgress: (id, callback) => ipcRenderer.on(`progress-${id}`, (_, value) => callback(value)),
    kill: id => ipcRenderer.send(`kill-${id}`),
    folder: () => ipcRenderer.invoke('folder')
});
