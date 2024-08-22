const { dialog } = require('electron');

module.exports = global => {
    /** @type {Map<string, { path: string; cb?: () => Promise<any>; }>} */
    const _ = new Map();

    const take = id => {
        _.set(id);
    };

    const append = (id, path, cb) => {
        _.set(id, { path, cb });
    };

    const free = id => {
        _.delete(id);
    };

    const loading = path => Array.from(_.values())
        .some(x => x?.path === path);

    const clean = () => Promise.allSettled(
        Array.from(_.values())
            .map(s => s?.cb)
            .filter(x => x !== undefined)
            .map(f => f())
    );

    const confirm = () => {
        if (!Array.from(_.values()).length) return true;
        const choice = dialog.showMessageBoxSync(global.window, {
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Exit',
            message: 'Are you sure you want to exit? This will cancel any ongoing downloads.'
        });
        return choice === 0;
    };

    return { take, append, free, loading, clean, confirm };
}
