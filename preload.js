const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    title: link => ipcRenderer.invoke('title', link),
    location: defaultPath => ipcRenderer.invoke('location', defaultPath),
    start: (link, output) => ipcRenderer.invoke('start', link, output)
});
