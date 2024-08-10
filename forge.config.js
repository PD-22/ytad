module.exports = {
  packagerConfig: {
    asar: false,
    extraResource: [
      'node_modules/ffmpeg-static/ffmpeg.exe'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
  ],
  plugins: [
  ],
};
