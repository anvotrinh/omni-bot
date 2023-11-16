const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function execAsync(command) {
  return new Promise((resolve, reject) => {
    console.log(command);
    exec(command, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function codeSignWindows() {
  const postponeUploadJSONPath = path.join(
    __dirname,
    `../dist/app/postponeUpload.json`,
  );
  const text = fs.readFileSync(postponeUploadJSONPath);
  let filePaths = [];
  try {
    filePaths = JSON.parse(text);
  } catch (e) {
    console.log(e);
  }
  const signCommand = `"C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.22000.0\\x64\\signtool.exe" sign /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /a `;
  const promises = filePaths
    .filter((filePath) => filePath.endsWith('.exe'))
    .map((filePath) => execAsync(`${signCommand}"${filePath}"`));
  return Promise.all(promises)
    .then(() => {
      console.log('Sign files completed');
    })
    .catch((e) => {
      console.log('Error', e);
    });
}

codeSignWindows();

exports.default = codeSignWindows;
