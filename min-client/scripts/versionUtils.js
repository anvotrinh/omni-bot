const fetch = require('node-fetch');

const DOWNLOAD_SERVER = 'https://qute-app.s3.amazonaws.com/';

function getLatestYMLFileName(platform) {
  if (platform === 'win32') {
    return 'latest.yml';
  } else if (platform === 'mac') {
    return 'latest-mac.yml';
  } else if (platform === 'linux') {
    return 'latest-linux.yml';
  }
  return '';
}

function getLatestVersion(platform) {
  const latestYML = getLatestYMLFileName(platform);
  return fetch(DOWNLOAD_SERVER + latestYML)
    .then((res) => {
      return res.text();
    })
    .then((text) => {
      if (!text) return null;
      const versionLine = text
        .split('\n')
        .find((line) => line.startsWith('version:'));
      if (!versionLine) return null;
      const version = versionLine.split(':')[1].trim();
      return version;
    });
}

function isGreaterVersion(versionA, versionB) {
  if (versionA === null && versionB === null) return false;
  if (versionA !== null && versionB === null) return true;
  if (versionA === null && versionB !== null) return false;

  const versionAParts = versionA.split('.').map((i) => parseInt(i));
  const versionBParts = versionB.split('.').map((i) => parseInt(i));
  if (versionAParts.length !== 3) return false;
  if (versionBParts.length !== 3) return false;
  const [majorA, minorA, patchA] = versionAParts;
  const [majorB, minorB, patchB] = versionBParts;

  if (majorA > majorB) return true;
  if (majorA < majorB) return false;

  if (minorA > minorB) return true;
  if (minorA < minorB) return false;

  return patchA > patchB;
}

exports.getLatestYMLFileName = getLatestYMLFileName;
exports.getLatestVersion = getLatestVersion;
exports.isGreaterVersion = isGreaterVersion;
