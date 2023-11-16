const path = require('path');
const fs = require('fs');
const { uploadFile } = require('./electronDelta');
const packageFile = require('./../package.json');
const curVersion = packageFile.version;

function uploadLatestMajorVersionFile() {
  const latestMajorPath = path.join(__dirname, `../dist/app/latest-major.json`);
  fs.writeFileSync(latestMajorPath, JSON.stringify({ version: curVersion }));
  console.log('Upload latest major file');
  return uploadFile(latestMajorPath);
}
uploadLatestMajorVersionFile();
