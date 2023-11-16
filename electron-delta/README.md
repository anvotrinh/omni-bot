## I'm working on macos delta updates. It's going to come soon. Help required!

# @electron-delta/builder

True delta updates for electronjs apps. It reduces the bandwidth usage by 90%. Users download only the delta. It uses binary diffing (`HDiffPatch` library) to generate the delta.

![Delta updates](https://electrondelta.com/assets/delta-downloading.png)

## Requirements

1. The app must use `electron-builder` to build the app.
2. Currently only `Windows` os is supported. MacOS support is arriving soon.
3. Target must be `nsis` or `nsis-web`

## Installation

#### Step 1:

```sh
npm install @electron-delta/builder -D
```

#### Step 2:

Create a file name called `.electron-delta.js` in the root of the project.

#### Step 3:

In the `electron-builder` config, mention the above file as `afterAllArtifactBuild` hook.

```json
"build": {
    "appId": "com.electron.sample-app",
    "afterAllArtifactBuild": ".electron-delta.js",
    "win": {
      "target": ["nsis"],
      "publish": ["github"]
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false,
    }
}
```

#### Step 4:

Paste the following code in the `.electron-delta.js` file. It will be executed after the app is built.

```js
// .electron-delta.js
const DeltaBuilder = require("@electron-delta/builder");
const path = require("path");

const options = {
  productIconPath: path.join(__dirname, "icon.ico"),
  productName: "electron-sample-app",

  getPreviousReleases: async () => {
    return [
      {
        version: '0.0.12',
        url: 'https://github.com/electron-delta/electron-sample-app/releases/download/v0.0.12/electron-sample-app-0.0.12.exe'
      },
      {
        version: '0.0.11',
        url: 'https://github.com/electron-delta/electron-sample-app/releases/download/v0.0.11/electron-sample-app-0.0.11.exe'
      },
      {
        version: '0.0.9',
        url: 'https://github.com/electron-delta/electron-sample-app/releases/download/v0.0.9/electron-sample-app-0.0.9.exe'
      }
    ];
  },
  sign: async (filePath) => {
    // sign each delta executable
  },
};

exports.default = async function (context) {
  const deltaInstallerFiles = await DeltaBuilder.build({
    context,
    options,
  });
  return deltaInstallerFiles;
};
```

## `options`
  - `productIconPath`: (required) Path to the icon file. The icon file must be a .ico file.
  - `productName`: (required) Name of the product.
  - `getPreviousReleases`: (required) Function to get the previous releases. It must return an array of objects. Each object must have `version` and `url` properties.
  - `sign`: (required) Function to sign the delta executable.
  - `cache`: (optional) Path to the cache directory. If not specified, the default cache directory will be used. The default cache directory is `~/.electron-delta/`.
  - `processName`: (optional) Name of the process. If different from the product name.
  - `latestVersion`: (optional) Latest version of the product. If not specified, the latest version will be fetched `process.env.npm_package_version`.
