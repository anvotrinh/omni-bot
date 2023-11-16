const fs = require('fs/promises');
const fsExtra = require('fs-extra');
const modifyNodeModules = require('./modify-node-modules');

const assetManifestPath = './build/asset-manifest.json';
const staticFolderPath = './build/static';
const nextStaticFolderPath = './min-client/dist/static';

const htmlFilePaths = [
  './min-client/index.html',
  './min-client/q1Help.html',
  './min-client/q1Autosuggest.html',
  './min-client/q1Popup.html',
  './min-client/q1ActionsBar.html',
  './min-client/q1Interpreter.html',
];

fsExtra.remove(nextStaticFolderPath, (err) => {
  if (err) return console.error(err);
  fsExtra.move(staticFolderPath, nextStaticFolderPath, (err) => {
    if (err) return console.error(err);
    console.log('moved!');
  });
});

const toSampleHTMLFilePath = (htmlFilePath) => {
  return htmlFilePath.replace(/\.html$/, '.sample.html');
};

const updateHTMLFile = async (path, manifest) => {
  let html = await fs.readFile(path, 'utf8');

  manifest.entrypoints.forEach((file) => {
    if (`${file}`.includes('static/css/')) {
      html = html.replace(/static\/css\/main\.[0-9a-z]+\.css/, file);
    } else if (`${file}`.includes('static/js/')) {
      html = html.replace(/static\/js\/main\.[0-9a-z]+\.js/, file);
    }
  });

  await fs.writeFile(path, html, 'utf8');
};

const main = async () => {
  try {
    const manifestData = await fs.readFile(assetManifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);
    const promises = [];
    for (let i = 0; i < htmlFilePaths.length; i++) {
      const htmlFilePath = htmlFilePaths[i];
      const sampleHTMLFilePath = toSampleHTMLFilePath(htmlFilePath);
      const promise = fs.copyFile(sampleHTMLFilePath, htmlFilePath).then(() => {
        return updateHTMLFile(htmlFilePath, manifest);
      });
      promises.push(promise);
    }
    promises.push(modifyNodeModules());
    await Promise.all(promises);
    console.log('index.html modified successfully.');
  } catch (e) {
    console.log(e);
  }
};

main();
