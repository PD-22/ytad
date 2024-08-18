const { app, dialog } = require('electron');
const { accessSync, statSync } = require('fs');

module.exports = () => {
    const fallback = app.getPath('downloads');
    const id = 'destination';
    let _, store;

    const set = path => { store.set(id, _ = path); return _; };

    const init = async () => {
        if (!store) store = new (await import('electron-store')).default();
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
    };

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
