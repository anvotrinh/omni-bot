require('dotenv').config();
const builder = require('electron-builder');

const { uploadLatestYML } = require('./electronDelta');
const packageFile = require('./../package.json');
const { getLatestVersion, isGreaterVersion } = require('./versionUtils');
const curVersion = packageFile.version;

const isPostponeUpload = !!process.argv.find((arg) =>
  arg.match('postponeUpload'),
);

module.exports = function (platform) {
  const options = {
    files: [
      '**/*',
      '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
      '!**/{appveyor.yml,.travis.yml,circle.yml}',
      '!**/node_modules/*.d.ts',
      '!**/*.map',
      '!**/*.md',
      '!**/._*',
      '!**/icons/source',
      '!dist/app',
      '!cache',
      '!cache-mac-intel',
      '!cache-mac-arm',
      // this is copied during the build
      '!**/icons/icon.icns',
      // localization files are compiled and copied to dist
      '!localization/',
      '!scripts/',
      // These are bundled in.
      '!**/main',
      // parts of modules that aren"t needed
      '!**/node_modules/@types/',
      '!**/node_modules/pdfjs-dist/legacy',
      '!**/node_modules/pdfjs-dist/lib',
      '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    ],
    extraResources: ['./extraResources/**'],
    publish: [
      {
        provider: 'generic',
        url: 'https://d1x3xw2y0p8ckx.cloudfront.net',
      },
    ],
    linux: {
      target: [
        {
          target: 'AppImage',
          arch: ['x64'],
        },
      ],
    },
    win: {
      icon: 'icons/icon256.ico',
      target: [
        {
          target: 'nsis',
          arch: ['x64'],
        },
      ],
    },
    nsis: {
      oneClick: true,
      perMachine: false,
      allowElevation: true,
      runAfterFinish: true,
      differentialPackage: true,
      createDesktopShortcut: 'always',
      deleteAppDataOnUninstall: true,
      artifactName: '${productName}-${version}.${ext}',
      uninstallDisplayName: '${productName}',
      installerIcon: 'icons/icon256.ico',
      installerHeaderIcon: 'icons/icon256.ico',
      uninstallerIcon: 'icons/icon256.ico',
    },
    mac: {
      icon: 'icons/icon.icns',
      hardenedRuntime: true,
      notarize: {
        teamId: 'VQ7RD596CK',
      },
      target: [
        {
          target: 'default',
          arch: ['x64', 'arm64'],
        },
      ],
    },
    directories: {
      output: 'dist/app',
      buildResources: 'resources',
    },
    protocols: [
      {
        name: 'HTTP link',
        schemes: ['http', 'https'],
      },
      {
        name: 'File',
        schemes: ['file'],
      },
    ],
    asar: true,
    afterAllArtifactBuild: 'scripts/electronDelta.js',
  };

  return getLatestVersion(platform).then((latestVersion) => {
    if (!isGreaterVersion(curVersion, latestVersion)) {
      console.log(
        `ERROR: Latest version is ${latestVersion}, please change to the greater version in the min-client/package.json`,
      );
      return;
    }
    return builder
      .build({
        publish: 'always',
        config: options,
      })
      .then(() => {
        if (isPostponeUpload) return;
        return uploadLatestYML(platform);
      });
  });
};
