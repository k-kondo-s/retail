// This file is needed because it is used by vscode and other tools that
// call `jest` directly.  However, unless you are doing anything special
// do not edit this file

const standard = require('@grafana/toolkit/src/config/jest.plugin.config');

// This process will use the same config that `yarn test` is using
module.exports = standard.jestConfig();
module.exports.setupFiles.push('./src/jest.setup.ts');
