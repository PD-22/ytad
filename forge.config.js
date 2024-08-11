module.exports = {
  packagerConfig: {
    asar: false,
    name: 'Youtube Audio Downloader',
    icon: 'src/icon.ico',
    extraResource: [
      'node_modules/ffmpeg-static/ffmpeg.exe'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'src/icon.ico'
      }
    },
  ],
  plugins: [
  ],
};
