const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('download', (link, output) =>
    ipcRenderer.invoke('download', link, output)
);
