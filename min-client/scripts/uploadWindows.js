const fs = require('fs');
const path = require('path');
const { uploadFile } = require('./electronDelta');

function uploadPostponeFile() {
  const postponeUploadJSONPath = path.join(
    __dirname,
    `../dist/app/postponeUpload.json`,
  );
  const text = fs.readFileSync(postponeUploadJSONPath);
  let uploadFilePaths = [];
  try {
    uploadFilePaths = JSON.parse(text);
  } catch (e) {
    console.log(e);
  }
  const promises = uploadFilePaths.map((filePath) => uploadFile(filePath));
  return Promise.all(promises)
    .then(() => {
      console.log('Upload files completed');
      fs.rmSync(postponeUploadJSONPath);
    })
    .catch((e) => {
      console.log('Error', e);
    });
}

uploadPostponeFile();
