module.exports = {
  packagerConfig: {
    asar: false,
    name: 'YouTube Audio Downloader',
    icon: 'src/icon.ico',
    extraResource: []
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
