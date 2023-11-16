const fs = require('fs/promises');

const electronScreenshotsIndexFilePath =
  './min-client/node_modules/electron-screenshots/lib/index.js';

const modifyNodeModules = async () => {
  let text = await fs.readFile(electronScreenshotsIndexFilePath, 'utf8');
  text = text.replace('capturer.capture()', 'capturer.capture(true)');
  await fs.writeFile(electronScreenshotsIndexFilePath, text);
  console.log('node_modules modified successfully.');
};

module.exports = modifyNodeModules;
