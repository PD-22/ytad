const { writeFile } = require('fs/promises');
const { join } = require('path');
const { promisify } = require('util');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');

ffmpeg.setFfmpegPath(ffmpegStatic);
const ytdlPath = join(__dirname, 'yt-dlp.exe');
const ytdl = async (link, rest) => {
    const command = `"${ytdlPath}" ${rest} "${link}"`;
    const { stdout, stderr } = await promisify(exec)(command);
    if (stderr) throw new Error(stderr);
    return stdout;
};

start('https://www.youtube.com/watch?v=_KztNIg4cvE');
async function start(link) {
    let command;
    try {
        console.log(link);
        const { default: filenamify } = await import('filenamify');
        const info = JSON.parse(await ytdl(link, '--dump-json'));
        const { title, webpage_url, formats } = info;
        console.log({ title, webpage_url });
        console.log('formats', formats.length);
        writeFile('log.json', JSON.stringify(info, null, 2));
        const format = formats
            .filter(f => f.audio_channels)
            .reduce((a, c) => (c.quality < a.quality ? c : a));
        if (!format) throw new Error('Missing format');

        const length = format.filesize || format.filesize_approx;
        command = ffmpeg(format.url)
        const output = `${filenamify(title).trim()}.mp3`;
        let lastPercent;
        const percent = p => {
            if (lastPercent === p) return;
            lastPercent = Math.floor(p * 100);
            console.log(`${lastPercent}%`);
        };
        percent(0);
        await new Promise((resolve, reject) => command
            .format('mp3')
            .on('progress', x => {
                if (!length) return;
                percent(x.targetSize * 1000 / length);
            })
            .on('end', () => { resolve(); })
            .on('error', err => setTimeout(() => unlink(output)
                .finally(() => { reject(err); })
            ))
            .save(output)
        );
        percent(1);
        console.log(output);
        return output;
    } finally {
        command?.kill();
    }
}
