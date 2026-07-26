const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  // Ignore Android Gradle build outputs. Watching them on Windows can crash Metro
  // with invalid paths like "...\\values\\?\\D:\\..." during packageDebugResources.
  resolver: {
    blockList: exclusionList([
      new RegExp(
        `${path
          .resolve(__dirname, 'android')
          .replace(/[/\\]/g, '[/\\\\]')}[/\\\\](app[/\\\\])?build[/\\\\].*`,
      ),
      /.*[/\\]android[/\\].*[/\\]build[/\\].*/,
    ]),
  },
  watcher: {
    additionalExts: ['env'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
