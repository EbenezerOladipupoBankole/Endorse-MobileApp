// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// pdf-lib depends on tslib. With package "exports" resolution Metro picks
// tslib's ESM wrapper, whose default import of the CommonJS build is undefined
// ("Cannot destructure property '__extends' of 'tslib.default'"). Point every
// tslib import at the self-contained ES build instead.
const tslibEs6 = require.resolve('tslib/tslib.es6.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') return { type: 'sourceFile', filePath: tslibEs6 };
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
