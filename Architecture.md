Please read [Min browser's Architecture](https://github.com/minbrowser/min/wiki/Architecture) before reading this document, since we write the app on top of MinBrowser and make some modifications.

![Screenshot 2023-07-19 at 15 06 21](https://github.com/st2017re/minih5/assets/39167266/20ece840-1845-4300-a367-a91c0321acab)

![Screenshot 2023-07-19 at 15 06 38](https://github.com/st2017re/minih5/assets/39167266/e64d4b3e-a1d3-4bd1-95fb-b37f048ede99)

### Main Process

`Main Process` is located in the `min-client/main` directory.
We make some mofications in `min-client/main/main.js` and `min-client/main/main.js`:

#### In `min-client/main/main.js`:

- Read/write q1Settings.json file (the file stores platform information, setting in `Setting Page` and some other settings used for development). use the setting and distribute it to Main UI
- Regist global shortcut to Show/Hide App
- Min allows multiple window (BrowserWindow). QUTE makes it only allows 1 window.
- Add icon to Tray bar
- Modify the app bounds (width, height, x, y)
- Check mouse cursor position to show/hide TopMenuBar, handle focus/blur behavior, auto-update, ...

#### In `min-client/main/viewManager.js`:

- Min browser only allow 1 BrowserView displayed at a time. Since QUTE needs to add Component (ex: Help Page), which has to display above Platform Browser View. so we modified it to be able to display multiple BrowserView at the same time.
- Create QUTE's BrowserView: Help, AutoSuggest, PopUp. Manage the display order. Handle view ipc event
- Fill the platform site's input or submit the query (from ComposeBox)

### UI Process

`UI Process` has 2 parts `Min UI Process` and `QUTE UI`:

#### Min UI Process

`Min UI Process` is located in the `min-client/js` directory.
We also make some modifications in `min-client/js/browserUI.js`:

- Store platforms state (lastOpenedTime, is loaded or not, is awake or sleeping) `q1TabInfos`. which will be used to determine which platform should be put to sleep by the algorithm in `min-client/main/main.js`. Also be used for the loading state (of the loading indicator).
- Capture a screenshot before user clicks another platform. Show the platform's screenshot when the platform is loading.

#### QUTE UI

`QUTE UI` is located in the `src` directory. It contains TopMenuBar, PlatformBar, ComposeBox, FileUploadBar
Note:

- Min UI Process `min-client/js` has been bundled into `bundle.js`
- `QUTE UI` also be bundled.
  `Min UI Process` and `QUTE UI` are in the same environment, but bundled into 2 different bundles, so `QUTE UI` can't directly use the function/object in `Min UI Process`, it instead uses `window.searchbar.emit` to make communication.

QUTE UI is able to send ipc message to `Main Process` via `window.ipc`

### Platform BrowserView

`Platform BrowserView` is also a tab in Min browser.
We used `min-client/data/userscripts` and `min-client/js/preload` to fill the input or submit the query to platform's website. Also, extract information and modify the UI of platform website.

- `min-client/data/userscripts` which can be accessed to the platform's website environment. `userscripts` be used to define the way to get the site's input DOM/submit button DOM (`min-client/main/viewManager.js` will later use it to fill/submit query). userscript can be used to modify the platform's site UI in some cases.
- `min-client/js/preload` (which use runs within the sandbox, but it has access to Electron's ipc).
  - `min-client/js/preload/default.js` fetch the autosuggest from the platform site, and sends it to `QUTE UI`. Also, handle upload file process, and extract upload items.
  - `min-client/js/preload/style.js` add style to platform's site.

### AutoSuggest BrowserView, Help BrowserView, Popup BrowserView

`AutoSuggest BrowserView`, `Help BrowserView`, `Popup BrowserView`

- html file located at `min-client/*.sample.html`, has postfix `.sample.html`
- js and css file located at `src/Q1*`, has prefix `Q1`.

To communicate with `QUTE UI`, these BrowserView have to use ipc message (Main Process is the intermediary)
