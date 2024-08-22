const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    info: link => ipcRenderer.invoke('info', link),
    download: (id, link, title) => ipcRenderer.invoke('download', id, link, title),
    onProgress: (id, callback) => ipcRenderer.on(`progress-${id}`, (_, value) => callback(value)),
    kill: id => ipcRenderer.send(`kill-${id}`),
    folder: () => ipcRenderer.invoke('folder'),
    take: id => ipcRenderer.invoke('take', id),
    free: id => ipcRenderer.invoke('free', id)
});
