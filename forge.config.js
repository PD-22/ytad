/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    asar: false,
    name: 'YouTube Audio Downloader',
    icon: 'src/icon.ico',
    executableName: 'ytad',
    extraResource: []
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      /** @type {import('@electron-forge/maker-squirrel').MakerSquirrelConfig} */
      config: {
        icon: 'src/icon.ico',
        name: 'ytad',
        setupIcon: 'src/icon.ico'
      }
    },
  ],
  plugins: [
  ],
};
