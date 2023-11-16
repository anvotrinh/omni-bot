require('dotenv').config();
const DeltaBuilder = require('@electron-delta/builder');
const path = require('path');
const fs = require('fs');
const fs_extra = require('fs-extra');
const packageFile = require('./../package.json');
const { execSync } = require('child_process');
const {
  PutObjectCommand,
  S3Client,
  ListObjectsCommand,
} = require('@aws-sdk/client-s3');
const builder = require('electron-builder');
const { getLatestYMLFileName } = require('./versionUtils');
const Arch = builder.Arch;

const isPostponeUpload = !!process.argv.find((arg) =>
  arg.match('postponeUpload'),
);

const client = new S3Client({});

const getVersion = (fileName) => {
  return fileName.match(/\d+\.\d+\.\d+/)[0];
};
const getPreviousReleases = async ({ platform, arch }) => {
  const listCommand = new ListObjectsCommand({
    Bucket: process.env.AWS_S3_BUCKET,
  });
  const listResponse = await client.send(listCommand);

  const prevReleases = (listResponse.Contents || [])
    .map((content) => content.Key)
    .filter((fileName) => {
      if (platform === 'win') {
        return fileName.endsWith('.exe') && !fileName.endsWith('-delta.exe');
      }
      if (platform === 'linux') {
        return fileName.endsWith('.AppImage');
      }
      // case mac arm64
      if (arch === Arch.arm64) {
        return fileName.endsWith('arm64-mac.zip');
      }
      // case mac x64
      return fileName.endsWith('.zip') && !fileName.endsWith('arm64-mac.zip');
    })
    .map((fileName) => ({
      version: getVersion(fileName),
      url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`,
    }));

  console.log('--prevReleases', prevReleases);
  return prevReleases;
};

const getFileName = (filePath) => {
  let parts;
  if (filePath.includes('/')) {
    parts = filePath.split('/');
  } else if (filePath.includes('\\')) {
    parts = filePath.split('\\');
  } else {
    return filePath;
  }
  return parts[parts.length - 1];
};
const uploadFile = async (filePath) => {
  try {
    const fileStream = fs.createReadStream(filePath);

    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: getFileName(filePath),
      Body: fileStream,
    });

    const response = await client.send(putCommand);
    console.log('upload file success', response);
  } catch (err) {
    console.error(err);
  }
};

const toArchFilePath = (filePath, arch) => {
  // ignore move file hpatchz and mac-updater
  if (!getFileName(filePath).includes('.')) return filePath;
  const postfixText = arch === Arch.x64 ? 'x64' : 'arm64';
  // fix delta json file
  if (filePath.endsWith('.json')) {
    const fileText = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(
      filePath,
      fileText.replace(/.delta"/g, `-${postfixText}.delta"`),
      'utf8',
    );
  }

  const fileName = getFileName(filePath).replace(
    /.(json|delta)$/,
    `-${postfixText}.$1`,
  );
  const newFilePath = path.join(__dirname, `../dist/app/${fileName}`);
  if (fs.existsSync(newFilePath)) {
    fs_extra.removeSync(newFilePath);
  }
  fs_extra.moveSync(filePath, newFilePath);
  return newFilePath;
};

exports.uploadLatestYML = function (platform) {
  const latestFileName = getLatestYMLFileName(platform);
  return uploadFile(path.join(__dirname, `../dist/app/${latestFileName}`));
};

exports.uploadFile = uploadFile;

exports.default = async function (context) {
  const options = {
    productIconPath: path.join(__dirname, '../icons/icon256.ico'),
    productName: packageFile.productName,
    cache: path.join(__dirname, '../cache'),
    getPreviousReleases,
    sign: async (filePath) => {
      // sign each delta executable
      return filePath;
    },
  };

  const platformNames = [];
  for await (const platform of context.platformToTargets.keys()) {
    platformNames.push(platform.buildConfigurationKey);
  }

  // TODO upgrade 7zip-bin package instead
  if (platformNames.includes('mac')) {
    console.log('Add permission to 7zip-bin');
    // https://github.com/electron-userland/electron-builder/issues/2044
    fs.chmodSync(
      path.join(
        __dirname,
        '../../electron-delta/node_modules/7zip-bin/mac/arm64/7za',
      ),
      '755',
    );
  }

  let deltaInstallerFiles = [];
  if (platformNames.includes('mac')) {
    // delta mac intel
    options.cache = path.join(__dirname, '../cache-mac-intel');
    options.getPreviousReleases = ({ platform }) =>
      getPreviousReleases({ platform, arch: Arch.x64 });
    options.arch = 'x64';
    const macIntelDeltaFiles = await DeltaBuilder.build({
      context,
      options,
    });
    macIntelDeltaFiles.forEach((filePath) => {
      const newFilePath = toArchFilePath(filePath, Arch.x64);
      deltaInstallerFiles.push(newFilePath);
    });
    // delta mac arm
    options.cache = path.join(__dirname, '../cache-mac-arm');
    options.getPreviousReleases = ({ platform }) =>
      getPreviousReleases({ platform, arch: Arch.arm64 });
    options.arch = 'arm64';
    const macArmDeltaFiles = await DeltaBuilder.build({
      context,
      options,
    });
    macArmDeltaFiles.forEach((filePath) => {
      const newFilePath = toArchFilePath(filePath, Arch.arm64);
      deltaInstallerFiles.push(newFilePath);
    });
  } else {
    // window, linux delta build
    deltaInstallerFiles = await DeltaBuilder.build({
      context,
      options,
    });
  }

  // upload files
  var uploadFilePaths = [...context.artifactPaths, ...deltaInstallerFiles];

  if (platformNames.includes('linux')) {
    console.log('build .deb package');
    const version = getVersion(context.artifactPaths[0]);
    const cacheDir =
      options.cache || path.join(require('os').homedir(), '.electron-delta');
    const dataDir = path.join(cacheDir, `./qute-${version}`);
    fs_extra.ensureDirSync(dataDir);
    const debianDir = path.join(dataDir, './DEBIAN');
    fs_extra.ensureDirSync(debianDir);
    const optDir = path.join(dataDir, './opt');
    fs_extra.ensureDirSync(optDir);
    const optQuteDir = path.join(optDir, './qute');
    fs_extra.ensureDirSync(optQuteDir);
    const usrDir = path.join(dataDir, './usr');
    fs_extra.ensureDirSync(usrDir);
    const usrBinDir = path.join(usrDir, './bin');
    fs_extra.ensureDirSync(usrBinDir);
    const usrShareDir = path.join(usrDir, './share');
    fs_extra.ensureDirSync(usrShareDir);
    const usrShareApplicationsDir = path.join(usrShareDir, './applications');
    fs_extra.ensureDirSync(usrShareApplicationsDir);
    fs.writeFileSync(
      path.join(debianDir, './control'),
      `Package: qute\nVersion: ${version}\nSection: base \nPriority: optional\nArchitecture: amd64\nDepends: fuse\nMaintainer: andrey@3ig,.kiev.ua\nDescription: Qute\n`,
    );
    fs.writeFileSync(
      path.join(debianDir, './postinst'),
      `#!/bin/sh\nset -e\nchmod 777 /opt/qute/Qute-${version}.AppImage\nupdate-desktop-database\nexit 0\n`,
    );
    fs.chmodSync(path.join(debianDir, './postinst'), '775');
    fs.copyFileSync(
      context.artifactPaths[0],
      path.join(optQuteDir, `./Qute-${version}.AppImage`),
    );
    fs.symlinkSync(`Qute-${version}.AppImage`, path.join(optQuteDir, `qute`));
    fs.symlinkSync(`/opt/qute/qute`, path.join(usrBinDir, `./qute`));
    fs.writeFileSync(
      path.join(usrShareApplicationsDir, './Qute.desktop'),
      `[Desktop Entry]\nEncoding=UTF-8\nType=Application\nExec=qute\nIcon=/opt/qute/icon256.ico\nName=Qute\n`,
    );
    fs.copyFileSync(
      options.productIconPath,
      path.join(optQuteDir, `./icon256.ico`),
    );
    fs.chmodSync(path.join(usrShareApplicationsDir, './Qute.desktop'), 777);
    execSync(`dpkg-deb --build ${dataDir}`);
    fs.copyFileSync(
      path.join(cacheDir, `./qute-${version}.deb`),
      path.join(context.outDir, `./qute-${version}.deb`),
    );
    uploadFilePaths = [
      ...uploadFilePaths,
      path.join(context.outDir, `./qute-${version}.deb`),
    ];
  }

  if (isPostponeUpload) {
    uploadFilePaths.push(path.join(__dirname, '../dist/app/latest.yml'));
    const postponeUploadJSONPath = path.join(
      __dirname,
      `../dist/app/postponeUpload.json`,
    );
    fs.writeFileSync(postponeUploadJSONPath, JSON.stringify(uploadFilePaths));
  } else {
    console.log(uploadFilePaths);
    const promises = uploadFilePaths.map((filePath) => uploadFile(filePath));
    await Promise.all(promises);
    console.log('Upload files completed');
  }
  return deltaInstallerFiles;
};
