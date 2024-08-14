const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    info: link => ipcRenderer.invoke('info', link),
    location: defaultPath => ipcRenderer.invoke('location', defaultPath),
    start: (id, link, output) => ipcRenderer.invoke('start', id, link, output),
    onProgress: (id, callback) => ipcRenderer.on(`progress-${id}`, (_, value) => callback(value))
});
