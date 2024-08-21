const { dialog } = require('electron');

module.exports = global => {
    /** @type {Map<string, Set<() => Promise>>} */
    const _ = new Map();

    const get = k => _.get(k);
    const has = k => _.has(k);
    const set = (k, v) => _.set(k, v);
    const count = k => get(k)?.size ?? 0;

    const inc = (k, f) => { if (!has(k)) set(k, new Set()); get(k).add(f); };

    const dec = (k, v) => {
        if (!has(k)) return;
        const killSet = get(k);
        if (!killSet.has(v)) return;
        killSet.delete(v);
        if (!killSet.size) _.delete(k);
    };

    const callbacks = () => Array.from(_.values())
        .flatMap(s => Array.from(s.values()));

    const clean = () => Promise.all(callbacks().map(f => f()));

    const confirm = () => {
        if (!callbacks().length) return true;
        const choice = dialog.showMessageBoxSync(global.window, {
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Exit',
            message: 'Are you sure you want to exit? This will cancel any ongoing downloads.'
        });
        return choice === 0;
    };

    return { count, inc, dec, clean, confirm };
}
