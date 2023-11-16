### Instructions

`npm install`

Create file `min-client/data/settings.json`, and write `{"userscriptsEnabled":true}` to the file

`npm start`

If error message of `bash: yarn: command not found`, then do: `export PATH=~/.npm-global/bin:$PATH`

### Concise, updated build/delta-update + auto-upload-to-AWS instructions:

- Build for WINDOWS: `npm run buildWindowsPostponeUpload && npm run codeSignWindows && npm run uploadWindows`
- Build for MAC (both Apple & Intel): `npm run buildMac`
- Build for LINUX: `npm run buildLinux`

### How to release (some more Notes)

Step 1 and 2 are one-time steps.
After making any code changes, when you want to publish a new release, do Steps 3,4,5,6.
All other steps are relevant only for end-user.

0. Download the app from https://github.com/st2017re/minih5/releases/tag/v0.0.10, Install it (drag it to Application)
   Open the setting page, it should show version 0.0.10
   -> Quit the app (press quit in the taskbar)

1. Create Developer ID Application Certificate (to sign the app)

- Add appleID: Open Xcode -> Settings -> Accounts -> "+" -> Apple ID
- After added apple account -> Manage Certificates -> "+" -> Developer ID Application

2. Download https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer and open it.

3. In Terminal

```
export APPLE_ID="silkobot@gmail.com"
export APPLE_APP_SPECIFIC_PASSWORD="..."
```

4. update package.json version to 0.0.11

5. npm run buildMacArm

6. Open `https://github.com/st2017re/minih5/releases`. Then click edit the new uploaded draft version -> click release

7. Re-open the app, in Application. At this time, the app is still version 0.0.10. Then the app downloads the new version in background (you can check it in the app's console).

8. Quit the app again. After quitting, the app automatically installs the new version. Then open the app again -> Setting page -> version should be v0.0.11

### How to release

#### One-time setup steps (only MacOS)

1. Install Xcode version >= 13
2. Create `Developer ID Application` Certificate (to sign the app)

- Add appleID: Xcode -> Settings -> Accounts -> "+" -> Apple ID
- After added apple account -> Manage Certificates -> "+" -> Developer ID Application

3. Download https://www.apple.com/certificateauthority/AppleWWDRCAG3.cer and open it.
4. Create "App Specific Password" (`electron-builder` use id & this password to upload the app for notarization)

- Open https://appleid.apple.com/account/manage/section/security
- select App-Specific Passwords -> "+" -> fill a name
- Store the app-specific password, we'll use it in the release steps.

5. Add Apple Developer Account's TeamId, get the teamId from `https://developer.apple.com/account#MembershipDetailsCard`

`min-client/scripts/createPackage.js`

```
notarize: {
  teamId: 'REPLACE YOUR TEAM ID HERE',
},
```

#### RELEASE steps

1. Add variables to environments (only MacOS)

```
export APPLE_ID="YOUR APPLE ID"
export APPLE_APP_SPECIFIC_PASSWORD="app-specific password generated from setup steps"
```

2. update version in `min-client/package.json` at line `"version": "..."`
3. `npm run buildWindows` or `npm run buildMacArm`, wait for the build process finish, it should take < 15mins
4. Open https://github.com/st2017re/minih5/releases. Click edit the new uploaded version (it in `draft` state) -> click `Publish Release` at the bottom of the page

#### Notes about Mac (Intel) / MacIntel

Run this for each build:

```
export APPLE_ID="silkobot@gmail.com"
export APPLE_APP_SPECIFIC_PASSWORD="..."
npm run buildMacIntel
```

In the terminal after the signing line, it should have the notarization successful line

```
  • signing         file=dist/app/mac/Qute.app identityName=Developer ID Application: ...
  • notarization successful
```

#### Notes about Ubuntu

The built app is at: https://github.com/st2017re/minih5/releases/tag/v0.0.19

build script: `npm run buildLinux`

The built file is AppImage file. (used AppImage because electron-updater only allow AppImage file)

To run the AppImage file, do the following steps

`Right-click -> Properties -> Permission -> tick the Execute -> Close button -> then double-click the app`

(Note: it only needs adding execute permission at the 1st time)

![image](https://github.com/st2017re/minih5/assets/61022879/06bb90de-5044-4173-9ac7-8f8f1c2c8bbf)

If the app doesn't run, run this line in terminal:
`sudo apt install libfuse2`

#### How to replace Github access token

GitHub access token used for uploading the packed app to GitHub, and for downloading it

To generate a new GitHub access token, go to https://github.com/settings/tokens/new. Create a token with repo scope/permission. Then replace the newly generated token here.

`min-client/scripts/createPackage.js`

```
publish: [
  {
    provider: 'github',
    ...
    token: 'REPLACE YOUR TOKEN HERE',
  },
],
```

#### Release steps for Windows

1. `npm run buildWindowsPostponeUpload` to create executable and delta

2. `npm run codeSignWindows` to sign all .exe files

3. `npm run uploadWindows` to upload all the files

### About OpenInterpreter:
- For Windows, during development, need to install the latest version of Visual Studio with "Desktop development with C++" workload, then git pull and npm install.
  - This is the requirement for re-building `node-pty` (in npm install step).
  - Thius isn't required for user to run the app.

### About Settings/Config-related files:

3 important files:

- `src/config.js` stores config related to ReactApp
- `min-client/main/config.js` stores config related to System Config including platforms
- `min-client/data/defaultUserData.json` is the default file for real userData.json. The `defaultUserData.json` file will be copied to the path of real `userData.json` the first time user uses the app.

### Set the app's background color (the blue one) for TopMenuBar, ComposeBox, etc.:

TopMenuBar: change background-color of `.navButtonWrapper` in `src/Custom.css`

ComposeBox, PlatformBar: change background-color of `.appContainer` in `src/Custom.css`

### Config of loading-animation

```
"loadingTrigger": {
  "loadingPage-start": "did-start-loading" | "begin-page-load",
  "loadingPage-end": "begin-page-load" | "dom-ready" | "did-stop-load",
  "loadingBottom-start": "did-start-loading" | "begin-page-load",
  "loadingBottom-end": "begin-page-load" | "dom-ready" | "did-stop-load",
}
```

Start trigger:

- did-start-loading: immediately, before starting wake-up.
- begin-page-load: after wake-up, the page begin to load

End trigger:

- begin-page-load: after wake-up, the page begin to load
- dom-ready: when the document in the top-level frame is loaded.
- did-stop-loading: all document is loaded.

### To set app Width and Height:

`main.js`

```
const DEFAULT_APP_WIDTH = 550;
```

`main.js`

```
  const defaultAppHeight = parseInt((size.height * 2) / 3);
  bounds = {
    x: 0,
    y: 0,
    width: DEFAULT_APP_WIDTH,
    height: defaultAppHeight,
    maximized: false,
  };
```

### To enable Inspector and right-click an Element to inspect its properties:

Change this to true to inspect element:
https://github.com/st2017re/minih5/blob/main/min-client/main/config.js

```
"shouldOpenMainDevTool": false,
```

### Set character of `/` vs. `@` for triggering Autosuggest:

`src/App.js`:

```
export const PLATFORM_CHAR = '@';
```

### Set the two colors of scrollbar for various platforms (WebViews):

`min-client/js/preload/style.js` and `min-client/data/userscripts/bing.js`:

```
      background-color: rgba(217, 217, 227, 0.8);
```

### Set line spacing and container height for ComposeBox:

Line spacing (line height):

`src/App.scss`:

```
--compose-box-line-height:
```

ComposeBox container height = padding-top (4px in below example) + composebox-line-height + padding-bottom (8px in below example):

`src/Input/index.scss`:

```
  padding: 4px var(--submit-button-and-padding) 8px 24px;
```

###

Change space between tag-button <> query-text (for example, 6px) in ComposeBox:

`src/Input/PlatformTag/index.scss`:

```
.platformTag:nth-last-of-type(1) {
  margin-right: 6px;
}
```

### Submit button GIFs:

`src/Images`

### Lowered opacity (70% = 0.7) of topMenuBar, PlatformsBar, and ComposeBox when app is not focused

`src/Custom.css`

```
body:not(.focused):not(.app-hide) #navbar {
  opacity: 0.7;
}
```

### Set color of selected text (highlighting) in ComposeBox:

`src/Custom.css`

```
::selection {
  background: yellow;
}
```

### To set styling of app window's shadow:

https://github.com/st2017re/minih5/blob/main/src/Custom.css#L13

```
box-shadow: 0 0 20px rgb(136 136 136 / 25%);
```

### Set delay time and icon file of the confirmation icon that stays for some time when Copy-URL button is clicked in TopMenuBar:

To change the delay time: https://github.com/st2017re/minih5/blob/main/src/Navbar/index.js#L41

```
  const handleCopyLink = () => {
    setIsCopied(true);
    copyToClipboard(getCurrentTabUrl());
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };
```

To change the SVG icon: https://github.com/st2017re/minih5/blob/main/src/SVG.js#L1105

```
export const CopiedIcon = () => {
  return (
    <svg
      width='32'
      height='32'
      viewBox='0 0 32 32'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M13.3604 15.2799L15.1234 17.0201L18.5533 12.8634C18.9048 12.4374 19.5351 12.377 19.961 12.7285C20.387 13.08 20.4474 13.7103 20.0959 14.1363L15.9702 19.1363C15.5964 19.5893 14.9144 19.6242 14.4964 19.2115L11.9554 16.7032C11.5624 16.3153 11.5583 15.6821 11.9463 15.2891C12.3342 14.896 12.9674 14.8919 13.3604 15.2799ZM12.667 6.6665H19.3337C22.6474 6.6665 25.3337 9.3528 25.3337 12.6665V19.3332C25.3337 22.6469 22.6474 25.3332 19.3337 25.3332H12.667C9.35328 25.3332 6.66699 22.6469 6.66699 19.3332V12.6665C6.66699 9.3528 9.35328 6.6665 12.667 6.6665ZM12.667 8.6665C10.4579 8.6665 8.66699 10.4574 8.66699 12.6665V19.3332C8.66699 21.5423 10.4579 23.3332 12.667 23.3332H19.3337C21.5428 23.3332 23.3337 21.5423 23.3337 19.3332V12.6665C23.3337 10.4574 21.5428 8.6665 19.3337 8.6665H12.667Z'
        fill='#92929D'
      />
    </svg>
  );
};
```

### Time-settings related to Submit-button's animation frames:

`SubmitButton.js`

```
const HOVER_OUT_STATE_TIME = 200;
const RELEASE_STATE_TIME = 500;

const stateMap = {
  idle: {
    images: [imageA1, imageA2, imageA1],
    customTimes: { 0: [1500, 2500] },
  },
  hover: {
    images: [imageA1, imageB1, imageB2],
    customTimes: { 2: 0 },
  },
  hoverOut: {
    images: [imageB2, imageB1, imageA1],
    customTimes: { 2: 0 },
  },
  pressing: {
    images: [imageA1, imageC1, imageC2],
    customTimes: { 2: 0 },
  },
  released: {
    images: [imageC2, imageA1, imageD1, imageD2, imageA1],
    customTimes: { 3: 200, 4: 0 },
  },
};
```

### To comment out to hide & disable the file-converter page (and the arrow button for it on PlatformsBar):

`src/PlatformBar/index.js`

```
<Button title='Convert' onClick={() => showPage(CONVERT_PAGE_NAME)}>
  <UpArrowSvg />
</Button>
```

### To set the amount of time threshold (when app is hidden) after which Alt+1 (to show the app again) causes existing query-text to be highlighted

`src/App.js`

```
const HIGHLIGHT_FOCUS_BACK_TIME = 60000;
```

### To set the threshold time of hover over PlatformsBar button that triggers the appearance of label in ComposeBox

`src/Input/index.js`

```
showHoverTimeoutId.current = setTimeout(() => {
  setShowPlatformHover(true);
}, 150);
```

### To change Alias:

After changed in `min-client/data/q1Settings.json` file, also find and replace alias in

1. `src/config.js`

2. `src/utils/tabList.js`

3. `min-client/main/viewManager.js` at

```
const isSendEachChar = ['pe', 'ch', 'pi'].includes(args.event.tabAlias);

const shouldEnterChar = ['pi'].includes(args.id);
```

4. `min-client/js/preload/default.js`

5. `min-client/js/browserUI.js` at

```
if (tabInfo.alias === 'gm') {
  return ['mail.google.com'].includes(currentHost);
}
if (tabInfo.alias === 'ch') {
  return ['beta.character.ai'].includes(currentHost);
}
```

### Change font (new notes):

Toggle the font by comment/uncomment these line in `src/Custom.css`:

```
  font-family: 'Satoshi', sans-serif;
  /* font-family: '.SFNSText-Regular', 'BlinkMacSystemFont', 'Helvetica Neue',
    'Segoe UI', 'Arial', sans-serif; */
}
```

### Change font (old notes):

Add it to CSS by `@font-face: ...` and use new defined font as default font

### System-tray icon:

Some icons use the path `min-client/icons/icon256.ico`

### Change icons for Platforms:

Check `src/utils/tabList.js` for the name of icon and change it in `src/SVG.js`

### Set Submit-button icon vertical position:

Change `bottom: 3px` in:

```
.buttonSubmit {
  position: absolute;
  bottom: 3px;
  right: 16px;
}
```

### To set the time threshold for hover duration that triggers TopMenuBar's buttons to be shown

`main.js`:
(Note: Units = hundreds of ms)

```
const TIME_THRESHOLD = 2; // 5;
```

### For fade-times of TopMenuBar items:

`src/Custom.css`:

```
.navButtonWrapper > button {
  transition: opacity 0.25s;
}
```

`src/Navbar/index.js`:

```
enableButtonTimeoutId.current = setTimeout(() => {
        setIsButtonDisabled(false);
      }, 250);
```

```
showTitleTimeoutId.current = setTimeout(() => {
        setIsShowTitle(true);
      }, 250);
```

### Set position of BACK button for Google auth-related pages (SSO-related pages):

`data/userscripts/%40default.js` / `data/userscripts/@default.js`:

```
  addBackButton: function (x = 20, y = 20) {
```

### Set vertical position of text-logo (at right-corner of PlatformsBar):

`src/Custom.css`

```
.platform-actions > img {
  margin-top: 2px;
}
```

### To choose: show vs. not-show the minimized window in TaskBar, when user presses Alt+1 to hide the app.

Comment these 2 lines in `min-client/main/main.js`, like this:

```
function showAppWindow() {
  ...
  // mainWindow.show();
  ...
}

function hideAppWindow() {
  ...
  // mainWindow.hide();
  ...
}
```

### Set the separate color of Platform-Autosuggest vs. color of Content-Autosuggest:

`src/Q1Autosuggest/index.css`:

```
.suggestion-platform {
  background: #393939;
}

.suggestion-text {
  background: #393939;
}
```

### Change label/name that is shown when hover over System Tray icon:

`main.js`

```
  mainTray.setToolTip('Q1 application.');
```

### Icon for installer/executable

`min-client/icons/icon256.ico`

### To change Zoom increment (which is done by Ctrl- and Ctrl+).

`min-client/js/webviewGestures.js`:

```
  zoomWebviewIn: function (tabId) {
    return this.zoomWebviewBy(tabId, 0.2);
  },
  zoomWebviewOut: function (tabId) {
    return this.zoomWebviewBy(tabId, -0.2);
  },
```

### To hide the help popup:

`min-client/main/viewManager.js`:

Change `getQ1HelpBounds` function to:

```
function getQ1HelpBounds() {
  return { x: 0, y: 0, width: 0, height: 0 };
}
```

### To change the help popup bounds:

`min-client/main/viewManager.js`:

```
function getQ1HelpBounds() {
  const mainBounds = mainWindow.getBounds();
  const x = Math.round(mainBounds.width * 0.2);
  const y = Math.round(mainBounds.height * 0.2);
  const width = Math.round(mainBounds.width * 0.6);
  const height = Math.round(mainBounds.height * 0.6);
  return { x, y, width, height };
}
```

### Change the app's name that is shown/used after creating binary:

Fix productName in `min-client/package.json`. For Mac, need to also change `Min.app` in `min-client/scripts/buildMac.js`

### Line number to change the amount of transparency of the app that happens when it is not focused:

`src/App.scss`, change opacity:

```
body:not(.focused):not(.app-hide) {
  opacity: 0.7;
}
```

### Line number to comment out (to hide) the light-yellow-color tooltip (on hover over item in PlatformsBar)

`src/PlatformBar/Item.js`:
Comment out `title={item.name}`:

```
       <div
          className={`tabDiv ${
            curPlatformAlias === item.alias ? 'active' : ''
          }`}
          title={item.name}
        >
```

### CSS Line number for setting the vertical spacing/distance at top of Settings page:

`src/Custom.css` (current space is 60px):

```
.settingPage {
  ...
   padding: calc(var(--app-topMenuBar) + 60px) 50px 0;
  ...
}
```

### Responsive design (media-query breakpoints)

Check `src/Pages/SettingsPage/index.scss`
Below is an example for the page's padding-top. You can also add this at the bottom of the scss file for other attributes you want to change.

```
// media query base on PC screen height
body.sh-768 .settingsPage {
  padding-top: 30px;
}

body.sh-900 .settingsPage {
  padding-top: 40px;
}

body.sh-992 .settingsPage {
  padding-top: 50px;
}

body.sh-1080 .settingsPage {
  padding-top: 60px;
}
```

Also, if you need to change other attributes in the Settings page, you can add it like this:

```
body.sh-1080 .settingsPage {
  padding-top: 60px;
  & .settingsPage-descriptionTitle {
    margin-bottom: 50px;
  }
}
```

### Platform-tags emoji-style (with SVG icon instead of `go`, etc.).

- Use --platform-tag-icon-size for the size of the tag's icon in each screen size

![image](https://github.com/st2017re/minih5/assets/61022879/326441fe-0a77-4949-b42b-068509e18945)

- You can also change some other padding/size variables by creating media query.

![image](https://github.com/st2017re/minih5/assets/61022879/ef65002c-cd7f-4eb1-9216-9c0941a2dee3)

### Special popup whenever Server has new info available:

Config link to the current json file:

![image](https://github.com/st2017re/minih5/assets/61022879/1dc0e085-b4ef-4c57-a458-e260a0588f42)

### PlatformsBar: When Expand button is clicked, auto-collapse it after N seconds.

Change `const AUTO_COLLAPSE_TIME = 3000;` in `src/PlatformBar.js`

Note: If AUTO_COLLAPSE_TIME == -1, then auto-collapse is disabled.

### Media query for submit-button:

Change `--submit-button-width` in `App.scss`

### Media-query breakpoints for Zoom-levels of Platforms

`main.js`

```
const ZOOM_LEVEL_MAP = {
```

### Media-query breakpoints for after-help notification

`viewManager.js`

```
const q1PopupHTMLFile = 'file://' + __dirname + '/q1Popup.html';
function getQ1PopupSize() {
  var { height } = getPrimaryScreenBounds();
  if (height >= 1080) {
    return { width: 331, height: 104 };
  }
  if (height >= 992) {
    return { width: 303, height: 92 };
  }
  if (height >= 900) {
    return { width: 273, height: 81 };
  }
  if (height >= 768) {
    return { width: 231, height: 64 };
  }
  return { width: 157, height: 50 };
}
```

### Style TagButtons:

- `--platform-tag-icon-size` to set icon size
- `platform-tag-height` to change the height of the platform tag, the platformtag is vertically center
- `compose-box-line-height` to change the line height (by making it taller, the vertical space between the TagButtons also increases)
- `tag-cap-height` to change the grey-cap height

### Set time-threshold of auto-collapse of PlatformsBar:

`src/PlatformBar/index.js`:

```
change const AUTO_COLLAPSE_TIME = 3000;
```

### How to create pre-saved screenshot

1. The screenshot was taken when user click other platforms. Please clicked to every platform icons.
2. The screenshot is automatically saved to `userData.json` in `Qute-development` folder (the path is different for each OS. MacOS: `/Users/[user]/Library/Application Support/Qute-development`)
3. Move `userData.json` to `min-client/data` and replace it into `defaultUserData.json`

### Adjustments to `interpreter.py` in OpenInterpreter:
If a relative-import error, then remove `.` from the various imports (for example: `from .cli import cli` -> `from cli import cli`)

Also add these lines under the imports:

```
from builtins import print as builtin_print

def print(args, **kwargs):
  builtin_print(args, **kwargs)

def Markdown(text):
  return text
```
