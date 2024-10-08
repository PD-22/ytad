const { ipcMain } = require('electron');
const { existsSync } = require('fs');
const { unlink } = require('fs/promises');
const { join, parse } = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('@distube/ytdl-core');
const log = require('electron-log');

module.exports = (global, lock, destination, filenamify) => {
    return async (_, id, link, title) => {
        const channel = `kill-${id}`;
        /** @type {ffmpeg.FfmpegCommand|undefined} */
        let command, output, aborted = false, resolveKill;
        const listener = () => { command?.kill(); aborted = true; };
        const killPromise = new Promise(f => resolveKill = f);
        const killCallback = () => {
            aborted = true;
            if (!command) return;
            command?.kill();
            return killPromise;
        };
        try {
            ipcMain.once(channel, listener);

            const info = await ytdl.getInfo(link);
            if (aborted) return;

            const format = ytdl.chooseFormat(info.formats,
                { quality: 'highestaudio', filter: 'audioonly' }
            );
            const length = (x => x > 0 ? x : null)(Number(format.contentLength));

            command = ffmpeg(ytdl.downloadFromInfo(info, { format }));
            const file = filenamify(title).trim();
            output = uniquePath(join(await destination.get(), `${file}.mp3`));
            lock.append(id, output, killCallback);

            await new Promise((resolve, reject) => command
                .format('mp3')
                .on('progress', x => {
                    if (!length) return;
                    const percent = x.targetSize * 1000 / length;
                    global.window?.webContents.send(`progress-${id}`, percent);
                })
                .on('end', () => { resolve(); })
                .on('error', err => setTimeout(() => unlink(output)
                    .finally(() => { reject(err); resolveKill(); })
                ))
                .save(output)
            );
            log.info({ link, title, output });
            return output;
        } catch (error) {
            const sigkill = 'ffmpeg was killed with signal SIGKILL'
            if (error?.message === sigkill) return { error: 'cancel' };
            throw error;
        } finally {
            ipcMain.removeListener(channel, listener);
            command?.kill();
            await lock.free(id);
        }
    }

    function uniquePath(path) {
        const { dir, name, ext } = parse(path);
        const [, main = name, digits] = name.match(/^(.+)\s\((\d+)\)/) ?? [];
        let count = parseInt(digits ?? 0);

        while (lock.loading(path) || existsSync(path))
            path = join(dir, `${main} (${++count})${ext}`);

        return path;
    }
}
