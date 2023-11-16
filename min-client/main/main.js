const electron = require('electron');
const fs = require('fs');
const fsAsync = require('fs/promises');
const mime = require('mime');
const path = require('path');
const { onExtendedProcessMetrics } = require('electron-process-reporter');
const fetch = require('node-fetch');
const { exec, spawn, execFile } = require('child_process');
const DeltaUpdater = require('@electron-delta/updater');
const logger = require('electron-log');
const tar = require('tar');
const AdmZip = require('adm-zip');
const pty = require('node-pty');
const { extractFull } = require('node-7z');
const osascript = require('node-osascript');
const Screenshots = require('electron-screenshots');
require('events').EventEmitter.defaultMaxListeners = 20;

Object.assign(console, logger.functions);

const { autoUpdater } = require('electron-updater');
const { downloadFile } = require('@electron-delta/updater/src/download');
autoUpdater.allowDowngrade = false;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
let deltaUpdater;

var q1LayoutSize = { height: 0, topMenuBarHeight: 0, baseTopMenuBarHeight: 0 };

const {
  app, // Module to control application life.
  protocol, // Module to control protocol handling
  BrowserWindow, // Module to create native browser window.
  webContents,
  session,
  ipcMain: ipc,
  Menu,
  MenuItem,
  crashReporter,
  dialog,
  nativeTheme,
  globalShortcut,
  Tray,
} = electron;

crashReporter.start({
  submitURL: 'https://minbrowser.org/',
  uploadToServer: false,
  compress: true,
});

process.traceProcessWarnings = true;
if (process.argv.some((arg) => arg === '-v' || arg === '--version')) {
  console.log('Min: ' + app.getVersion());
  console.log('Chromium: ' + process.versions.chrome);
  process.exit();
}

let isInstallerRunning = false;
const isDevelopmentMode = process.argv.some(
  (arg) => arg === '--development-mode',
);

function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
}

if (process.platform === 'win32') {
  (async function () {
    var squirrelCommand = process.argv[1];
    if (
      squirrelCommand === '--squirrel-install' ||
      squirrelCommand === '--squirrel-updated'
    ) {
      isInstallerRunning = true;
      await registryInstaller.install();
    }
    if (squirrelCommand === '--squirrel-uninstall') {
      isInstallerRunning = true;
      await registryInstaller.uninstall();
    }
    if (require('electron-squirrel-startup')) {
      app.quit();
    }
  })();
}

if (isDevelopmentMode) {
  app.setPath('userData', app.getPath('userData') + '-development');
}

// workaround for flicker when focusing app (https://github.com/electron/electron/issues/17942)
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows', 'true');

const userScriptPath = app.getAppPath() + '/data';
const userDataPath = app.getPath('userData');

const userDataJSONFilePath = path.join(userDataPath, 'UserData.json');
const defaultUserDataJSONFilePath = path.join(
  app.getAppPath(),
  '/data/defaultUserData.json',
);
const operationParentFolderPath = path.join(userDataPath, 'Operation');

const browserPage = 'file://' + __dirname + '/index.html';
const DEFAULT_APP_MARGIN = 0;
const ACTION_BAR_MARGIN = 5;
const MINI_MODE_WIDTH = 350 + DEFAULT_APP_MARGIN * 2;
const MINI_MODE_HEIGHT = 350 + DEFAULT_APP_MARGIN * 2;

var mainWindow = null;
var mainWindowIsMinimized = false; // workaround for https://github.com/minbrowser/min/issues/1074
var mainWindowIsMiniMode = false;
var mainMenu = null;
var mainTray = null;
var secondaryMenu = null;
var isFocusMode = false;
var appIsReady = false;
var isExitApp = false;
var windowsHelperProcess = null;

var userData = {
  snapPosition: 'right',
  maxMemoryMB: 2000,
  showHotKey: 'Alt+1',
  lastUsedPlatformAlias: 'gp',
  isCompletedHelpTutorial: false,
  nextOperationId: 0,
  operations: [],
  lastScreenshots: {},
  lastHomeScreenshots: {},
  openAIAPIKey: '',
};

const isFirstInstance = app.requestSingleInstanceLock();

const getAppMargin = () => {
  return 0;
};

if (process.platform !== 'darwin') {
  // Fix to prevent the app to flash twice on Windows
  // https://github.com/electron/electron/issues/22691
  app.commandLine.appendSwitch('wm-window-animations-disabled');
}

if (!isFirstInstance) {
  app.quit();
  return;
}

function sendIPCToWindow(window, action, data) {
  if (window && window.webContents && window.webContents.isLoadingMainFrame()) {
    // immediately after a did-finish-load event, isLoading can still be true,
    // so wait a bit to confirm that the page is really loading
    setTimeout(function () {
      if (window.webContents.isLoadingMainFrame()) {
        window.webContents.once('did-finish-load', function () {
          window.webContents.send(action, data || {});
        });
      } else {
        window.webContents.send(action, data || {});
      }
    }, 0);
  } else if (window) {
    window.webContents.send(action, data || {});
  } else {
    // var window = createWindow();
    // window.webContents.once('did-finish-load', function () {
    //   window.webContents.send(action, data || {});
    // });
  }
}

function openTabInWindow(url) {
  sendIPCToWindow(mainWindow, 'addTab', {
    url: url,
  });
}

function handleCommandLineArguments(argv) {
  // the "ready" event must occur before this function can be used
  if (argv) {
    argv.forEach(function (arg, idx) {
      if (arg && arg.toLowerCase() !== __dirname.toLowerCase()) {
        // URL
        if (arg.indexOf('://') !== -1) {
          sendIPCToWindow(mainWindow, 'addTab', {
            url: arg,
          });
        } else if (idx > 0 && argv[idx - 1] === '-s') {
          // search
          sendIPCToWindow(mainWindow, 'addTab', {
            url: arg,
          });
        } else if (/\.(m?ht(ml)?|pdf)$/.test(arg) && fs.existsSync(arg)) {
          // local files (.html, .mht, mhtml, .pdf)
          sendIPCToWindow(mainWindow, 'addTab', {
            url: 'file://' + path.resolve(arg),
          });
        }
      }
    });
  }
}

app.whenReady().then(() => {
  createTray();
});

function getPrimaryScreenBounds() {
  return electron.screen.getPrimaryDisplay().bounds;
}
function getWindowNormalBounds() {
  var size = getPrimaryScreenBounds();
  const height = Math.min(
    810,
    Math.round((size.height * 2) / 3) + 2 * getAppMargin(),
  );
  const width = Math.round(height * 0.8);
  const x = Math.round((size.width - width) / 2);
  const y = Math.round((size.height - height) / 2);
  return { x, y, width, height };
}
function showAppWindow() {
  if (!mainWindow) return;
  // this is a workaround to restore the focus on the previously focussed window
  if (process.platform === 'darwin') {
    app.show();
  } else {
    mainWindow.restore();
  }
  mainWindow.show();
  sendIPCToWindow(mainWindow, 'appShow');
}
function hideAppWindow() {
  if (!mainWindow) return;
  sendIPCToWindow(mainWindow, 'appHide');
  // this is a workaround to restore the focus on the previously focussed window
  if (process.platform !== 'darwin') {
    mainWindow.minimize();
  }
  //mainWindow.hide();
  if (process.platform === 'darwin') {
    app.hide();
  }
}
function isAppNotFocus() {
  return (
    mainWindow.isMinimized() ||
    !mainWindow.isVisible() ||
    !mainWindow.isFocused()
  );
}
function focusToComposeBox() {
  if (isAppNotFocus()) {
    showAppWindow();
  }
  mainWindow.webContents.focus();
  sendIPCToWindow(mainWindow, 'appFocusBack');
}
function changeToNormalMode(forceCenter) {
  if (!mainWindowIsMiniMode) return;
  mainWindowIsMiniMode = false;
  if (forceCenter || SYSTEM_CONFIG.shouldMiniToNormalAtCenter) {
    mainWindow.setBounds(getWindowNormalBounds());
    updateAllViewsBodyClass(false);
    return;
  }
  const { width, height } = getWindowNormalBounds();
  const { x: miniX, y: miniY } = mainWindow.getBounds();
  const newX = miniX + (MINI_MODE_WIDTH - width) / 2;
  const newY = miniY + (MINI_MODE_HEIGHT - height) / 2;
  const bounds = {
    x: Math.round(newX),
    y: Math.round(newY),
    width,
    height,
  };
  mainWindow.setBounds(getInsideBounds(bounds));
  updateAllViewsBodyClass(false);
}
function handleHotKey() {
  if (isAppNotFocus()) {
    showAppWindow();
    changeToNormalMode(true);
    return;
  }
  if (mainWindowIsMiniMode) {
    changeToNormalMode(false);
    return;
  }
  const isFocusedMain = mainWindow.webContents.isFocused();
  if (!isFocusedMain) {
    mainWindow.webContents.focus();
  }
  sendIPCToWindow(mainWindow, 'q1-hotkeyFocus', {
    isFocusedMain,
    showHotKey: userData.showHotKey,
  });
}
function changeToMiniMode() {
  mainWindowIsMiniMode = true;
  const { x, y } = electron.screen.getCursorScreenPoint();
  const bounds = {
    x: x - MINI_MODE_WIDTH / 2,
    y: y - MINI_MODE_HEIGHT / 2,
    width: MINI_MODE_WIDTH,
    height: MINI_MODE_HEIGHT,
  };
  mainWindow.setBounds(getInsideBounds(bounds));
  updateAllViewsBodyClass(true);
}
function handleMiniModeHotKey() {
  if (isAppNotFocus()) {
    focusToComposeBox();
    changeToMiniMode();
    return;
  }
  if (mainWindowIsMiniMode) {
    hideAppWindow();
  } else {
    changeToMiniMode();
  }
}

function isEmptyCopiedText(str) {
  const text = str.trim().replace(/^"/, '').replace(/"$/, '');
  return /^\s*$/.test(text);
}
function handleCopyTextMac() {
  osascript.execute(
    `set savedClipboard to the clipboard

delay 0.1

tell application "System Events" to keystroke "c" using {command down}
delay 0.1

set theSelectedText to the clipboard

set the clipboard to savedClipboard

if theSelectedText = savedClipboard then
  return ""
else
  return theSelectedText
end if`,
    function (err, result, raw) {
      if (err) {
        console.error(err);
        return;
      }
      showAppWindow();
      mainWindow.webContents.focus();
      // collapse case
      if (typeof result !== 'string' || isEmptyCopiedText(result)) {
        sendIPCToWindow(mainWindow, 'appFocusBack');
        return;
      }

      let text;
      if (result.includes('\n')) {
        text = result.trim().replace(/^"/, '').replace(/"$/, '');
      } else {
        text = result;
      }
      sendIPCToWindow(mainWindow, 'q1App-replaceComposeBoxText', {
        text: text + '\n',
      });
    },
  );
}

function runWindowsHelper() {
  let windowsHelperPath;
  if (app.isPackaged) {
    windowsHelperPath = '../extraResources/windows-helper/Step.exe';
  } else if (SYSTEM_CONFIG.shouldUseDebugWindowsHelperExe) {
    windowsHelperPath = '../csharp/Src_Step/Step/bin/Debug/Step.exe';
  } else {
    windowsHelperPath = 'extraResources/windows-helper/Step.exe';
  }
  windowsHelperProcess = execFile(path.join(__dirname, windowsHelperPath));
  windowsHelperProcess.stdout.on('data', function (data) {
    const text = data.toString().trim();
    if (text !== '') {
      sendIPCToWindow(mainWindow, 'q1App-replaceComposeBoxText', {
        text: text + '\n',
      });
    }
  });
  windowsHelperProcess.stderr.on('data', function (data) {
    console.log('windows helper error', data.toString());
  });
  windowsHelperProcess.on('exit', function () {
    console.log('exit windows helper process');
  });
}

function handlePasteTextWindows(text) {
  if (!windowsHelperProcess) return;
  hideAppWindow();
  windowsHelperProcess.stdin.write(
    `{"Command_ID": 2, "Command_Parameter": "${text}"}\n`,
  );
}

function handlePasteTextMac(text) {
  hideAppWindow();

  osascript.execute(
    `set savedClipboard to the clipboard

delay 0.1
set newText to "${text.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"

set the clipboard to newText

tell application "System Events" to keystroke "v" using {command down}
delay 0.1

set the clipboard to savedClipboard`,
    function (err, result, raw) {
      if (err) {
        console.error(err);
        return;
      }
    },
  );
}

function initScreenshotTool() {
  const screenshots = new Screenshots();
  const cleanCaptureScreenshot = () => {
    globalShortcut.unregister('Esc');
    globalShortcut.unregister('Enter');
  };
  globalShortcut.register('Alt+3', () => {
    screenshots.startCapture();

    globalShortcut.register('Esc', () => {
      screenshots.endCapture();
      cleanCaptureScreenshot();
    });
    globalShortcut.register('Enter', () => {
      screenshots.$view.webContents
        .executeJavaScript(
          `(() => {
            const tickButtonDOM = document.querySelector('.screenshots-button:has(> .icon-ok)');
            if (tickButtonDOM) {
              tickButtonDOM.click();
              true;
            } else {
              false;
            }
          })()`,
        )
        .then((hasTickButton) => {
          if (!hasTickButton) return;
          screenshots.endCapture();
          cleanCaptureScreenshot();
        });
    });
  });
  screenshots.on('ok', async (e, arraybuffer, bounds) => {
    console.log('screenshot captured');
    cleanCaptureScreenshot();
    focusToComposeBox();
    await wait(25);

    if (selectedView !== 'gp' && selectedView !== 'bi') return;
    const file = {
      arraybuffer,
      path: 'screenshot.png',
      name: 'screenshot.png',
      type: 'image/png',
    };
    const { webContents } = viewMap[selectedView];
    webContents.send('q1View-uploadFile', { files: [file], value: '' });
  });
  screenshots.on('cancel', () => {
    cleanCaptureScreenshot();
  });
  screenshots.on('save', (e, buffer, bounds) => {
    cleanCaptureScreenshot();
  });
  screenshots.on('afterSave', (e, buffer, bounds, isSaved) => {
    cleanCaptureScreenshot();
  });
}

function createWindow() {
  try {
    if (!fs.existsSync(userDataJSONFilePath)) {
      fs.copyFileSync(defaultUserDataJSONFilePath, userDataJSONFilePath);
    }
    var data = fs.readFileSync(userDataJSONFilePath, 'utf-8');
    userData = {
      ...userData,
      ...JSON.parse(data),
    };
  } catch (e) {}

  if (userData.showHotKey && userData.showHotKey !== 'NONE') {
    globalShortcut.register(userData.showHotKey, handleHotKey);
  }

  if (SYSTEM_CONFIG.textImportEnabled) {
    if (process.platform === 'win32') {
      runWindowsHelper();
    }
    if (process.platform === 'darwin') {
      globalShortcut.register('Alt+2', () => {
        handleCopyTextMac();
      });
    }
  }

  if (SYSTEM_CONFIG.screenshotToolEnabled) {
    initScreenshotTool();
  }

  globalShortcut.register('Alt+4', handleMiniModeHotKey);
  // init bounds
  const bounds = getWindowNormalBounds();
  return createWindowWithBounds(bounds);
}

var lastActiveTime;
function createWindowWithBounds(bounds) {
  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    // resizable: false,
    minWidth: MINI_MODE_WIDTH,
    minHeight: MINI_MODE_HEIGHT,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 10 },
    icon: __dirname + '/icons/icon256.png',
    alwaysOnTop: settings.get('windowAlwaysOnTop'),
    // backgroundColor: '#fff', // the value of this is ignored, but setting it seems to work around https://github.com/electron/electron/issues/10559
    // transparent: true,
    frame: false,
    // hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true, // used by ProcessSpawner
      spellcheck: false,
      additionalArguments: [
        '--user-data-path=' + userDataPath,
        '--app-version=' + app.getVersion(),
        '--app-name=' + app.getName(),
        '--user-script-path=' + userScriptPath,
        ...(isDevelopmentMode ? ['--development-mode'] : []),
      ],
    },
  });
  mainWindow.focus();

  // windows and linux always use a menu button in the upper-left corner instead
  // if frame: false is set, this won't have any effect, but it does apply on Linux if "use separate titlebar" is enabled
  if (process.platform !== 'darwin') {
    mainWindow.setMenuBarVisibility(false);
  }

  // hide traffic lights buttons on Mac
  if (process.platform === 'darwin') {
    mainWindow.setWindowButtonVisibility(false);
  }

  // and load the index.html of the app.
  mainWindow.loadURL(browserPage);

  mainWindow.destroyAllViews = () => {
    logger.info('destroy view');
    destroyAllViews();
  };

  mainWindow.on('close', function (e) {
    if (process.platform === 'darwin' || isExitApp) {
      destroyAllViews();
      return;
    }
    e.preventDefault();
    hideWindow();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    mainWindowIsMinimized = false;
  });

  mainWindow.on('focus', function () {
    if (!mainWindowIsMinimized) {
      mainWindow.webContents.focus();
      sendIPCToWindow(mainWindow, 'appFocus', { lastActiveTime });
    }
    sendIPCToWindow(mainWindow, 'q1-appFocus');
  });
  mainWindow.on('blur', function () {
    lastActiveTime = new Date().getTime();
    sendIPCToWindow(mainWindow, 'q1-appBlur');
  });
  // mainWindow.on('moved', function () {
  //   if (process.platform === 'darwin') return;
  //   calculateWindowSnapPosition();
  // });

  mainWindow.on('minimize', function () {
    sendIPCToWindow(mainWindow, 'minimize');
    mainWindowIsMinimized = true;
  });
  mainWindow.on('restore', function () {
    mainWindowIsMinimized = false;
  });

  mainWindow.on('maximize', function () {
    sendIPCToWindow(mainWindow, 'maximize');
  });

  mainWindow.on('unmaximize', function () {
    sendIPCToWindow(mainWindow, 'unmaximize');
  });

  // mainWindow.on('resize', function () {
  // if (mainWindow.getBounds().width === DEFAULT_APP_WIDTH) {
  //   mainWindow.setResizable(false);
  // }
  // });

  mainWindow.on('enter-full-screen', function () {
    mainWindow.setResizable(true);
    isWindowFullscreen = true;
    showedMenuBar = false;
    sendIPCToWindow(mainWindow, 'q1-hideMenuBar');
    // default
    sendIPCToWindow(mainWindow, 'enter-full-screen');
  });

  mainWindow.on('leave-full-screen', function () {
    isWindowFullscreen = false;
    sendIPCToWindow(mainWindow, 'leave-full-screen');
    // https://github.com/minbrowser/min/issues/1093
    mainWindow.setMenuBarVisibility(false);
  });

  mainWindow.on('enter-html-full-screen', function () {
    sendIPCToWindow(mainWindow, 'enter-html-full-screen');
  });

  mainWindow.on('leave-html-full-screen', function () {
    sendIPCToWindow(mainWindow, 'leave-html-full-screen');
    // https://github.com/minbrowser/min/issues/952
    mainWindow.setMenuBarVisibility(false);
  });

  /*
  Handles events from mouse buttons
  Unsupported on macOS, and on Linux, there is a default handler already,
  so registering a handler causes events to happen twice.
  See: https://github.com/electron/electron/issues/18322
  */
  if (process.platform === 'win32') {
    mainWindow.on('app-command', function (e, command) {
      if (command === 'browser-backward') {
        sendIPCToWindow(mainWindow, 'goBack');
      } else if (command === 'browser-forward') {
        sendIPCToWindow(mainWindow, 'goForward');
      }
    });
  }

  // prevent remote pages from being loaded using drag-and-drop, since they would have node access
  mainWindow.webContents.on('will-navigate', function (e, url) {
    if (url !== browserPage) {
      e.preventDefault();
    }
  });

  mainWindow.setTouchBar(buildTouchBar());
  if (SYSTEM_CONFIG.shouldOpenMainDevTool) {
    setTimeout(function () {
      mainWindow.webContents.openDevTools({ mode: 'undocked' });
    }, 1000);
  }
  createQ1Autosuggest();
  quitAndRunOperationServer();
  return mainWindow;
}

// fetch notice popup
async function checkNoticePopup() {
  if (!userData.isCompletedHelpTutorial) return;
  try {
    const response = await fetch(SYSTEM_CONFIG.noticePopupJsonUrl);
    const data = await response.json();
    sendIPCToWindow(mainWindow, 'q1App-noticePopup', data);
  } catch (e) {
    console.log(e.message);
  }
}
setInterval(() => {
  checkNoticePopup();
}, 5 * 60 * 1000);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q

  // mainWindow to ensure not close by app delta update window
  if (process.platform !== 'darwin' && mainWindow) {
    app.quit();
  }
});

app.on('quit', function () {
  mainTray && mainTray.destroy();
});

var isStoredScreenshot = false;
app.on('before-quit', function (e) {
  if (isStoredScreenshot) return;
  e.preventDefault();
  isStoredScreenshot = true;
  captureSelectedView()
    .then((res) => {
      if (!res) {
        app.quit();
        return;
      }
      const [viewId, imgUrl] = res;
      storeLastScreenshot(viewId, imgUrl);
      app.quit();
    })
    .catch((e) => {
      app.quit();
    });
});

const checkMajorUpdate = async (downloadedInfo) => {
  const res = await fetch(SYSTEM_CONFIG.latestMajorJsonUrl);
  const data = await res.json();
  const latestMajorVersion = data.version;
  downloadedInfo.isMajorUpdate = isGreaterVersion(
    latestMajorVersion,
    app.getVersion(),
  );
  sendIPCToWindow(mainWindow, 'q1App-autoUpdateEvent', {
    type: 'update-downloaded',
    data: downloadedInfo,
  });
};
const updaterAttachListeners = () => {
  return new Promise((resolve, reject) => {
    deltaUpdater.hostURL = deltaUpdater.updateConfig.url;
    deltaUpdater.attachListeners(resolve, reject);
    deltaUpdater.handleUpdateDownloaded = (info, resolve) => {
      deltaUpdater.autoUpdateInfo = info;
      checkMajorUpdate(info);
      resolve();
    };
    autoUpdater.on('update-not-available', (data) => {
      checkNoticePopup();
    });
  })
    .then(() => {
      console.log('attached listener');
    })
    .catch((e) => {
      console.log('error attached listener', e);
    });
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async function () {
  settings.set('restartNow', false);
  appIsReady = true;

  /* the installer launches the app to install registry items and shortcuts,
  but if that's happening, we shouldn't display anything */
  if (isInstallerRunning) {
    return;
  }

  const deltaUpdaterObj = new DeltaUpdater({ logger, autoUpdater });
  deltaUpdater = deltaUpdaterObj;

  createWindow();

  mainWindow.webContents.on('did-finish-load', function () {
    // if a URL was passed as a command line argument (probably because Min is set as the default browser on Linux), open it.
    handleCommandLineArguments(process.argv);

    updateAllViewsBodyClass();

    sendIPCToWindow(mainWindow, 'loadPlatformsAndUserData', {
      platforms: SYSTEM_CONFIG.platforms,
      userData,
      defaultIsStartWhenPCStart: app.getLoginItemSettings().openAtLogin,
      appVersion: app.getVersion(),
    });

    // for static placeholder
    // sendIPCToWindow(mainWindow, 'addTab', {
    //   url: '',
    //   alias: 'placeholder',
    //   openInBackground: true,
    // });
    // load awake tab
    SYSTEM_CONFIG.platforms.forEach((platform) => {
      if (
        platform.state !== 'awake' &&
        platform.alias !== userData.lastUsedPlatformAlias
      ) {
        return;
      }
      sendIPCToWindow(mainWindow, 'addTab', {
        ...platform,
        openInBackground: true,
      });
    });
    // check update
    if (!app.isPackaged) {
      checkNoticePopup();
    }
    setTimeout(() => {
      app.isPackaged && updaterAttachListeners(deltaUpdater);
    }, 2000);
  });

  mainMenu = buildAppMenu();
  Menu.setApplicationMenu(mainMenu);
  createDockMenu();
});

app.on('open-url', function (e, url) {
  if (appIsReady) {
    sendIPCToWindow(mainWindow, 'addTab', {
      url: url,
    });
  } else {
    global.URLToOpen = url; // this will be handled later in the createWindow callback
  }
});

// handoff support for macOS
app.on('continue-activity', function (e, type, userInfo, details) {
  if (type === 'NSUserActivityTypeBrowsingWeb' && details.webpageURL) {
    e.preventDefault();
    sendIPCToWindow(mainWindow, 'addTab', {
      url: details.webpageURL,
    });
  }
});

app.on('second-instance', function (e, argv, workingDir) {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    // add a tab with the new URL
    handleCommandLineArguments(argv);
  }
});

/**
 * Emitted when the application is activated, which usually happens when clicks on the applications's dock icon
 * https://github.com/electron/electron/blob/master/docs/api/app.md#event-activate-os-x
 *
 * Opens a new tab when all tabs are closed, and min is still open by clicking on the application dock icon
 */
app.on('activate', function (/* e, hasVisibleWindows */) {
  if (!mainWindow && appIsReady) {
    // sometimes, the event will be triggered before the app is ready, and creating new windows will fail
    createWindow();
  }
});

ipc.on('focusMainWebContents', function () {
  mainWindow.webContents.focus();
});

ipc.on('showSecondaryMenu', function (event, data) {
  if (!secondaryMenu) {
    secondaryMenu = buildAppMenu({ secondary: true });
  }
  secondaryMenu.popup({
    x: data.x,
    y: data.y,
  });
});

ipc.on('handoffUpdate', function (e, data) {
  if (app.setUserActivity && data.url && data.url.startsWith('http')) {
    app.setUserActivity('NSUserActivityTypeBrowsingWeb', {}, data.url);
  } else if (app.invalidateCurrentActivity) {
    app.invalidateCurrentActivity();
  }
});

function calculateWindowSnapPosition() {
  const { cursorX, displayBounds } = getCurrentDisplayInfo();

  const snapPosition =
    cursorX > displayBounds.x + displayBounds.width / 2 ? 'right' : 'left';
  setWindowSnapPosition(snapPosition);
}
ipc.on('calculateWindowSnapPosition', function () {
  calculateWindowSnapPosition();
});
function getInsideBounds(bounds) {
  // make the bounds fit inside a currently-active screen
  // (since the screen Min was previously open on could have been removed)
  // see: https://github.com/minbrowser/min/issues/904
  var containingRect = electron.screen.getDisplayMatching(bounds).workArea;

  return {
    x: clamp(
      bounds.x,
      containingRect.x,
      containingRect.x + containingRect.width - bounds.width,
    ),
    y: clamp(
      bounds.y,
      containingRect.y,
      containingRect.y + containingRect.height - bounds.height,
    ),
    width: clamp(bounds.width, 0, containingRect.width),
    height: clamp(bounds.height, 0, containingRect.height),
    maximized: false,
  };
}
// incase 2 monitor
function getCurrentDisplayInfo() {
  const mainBounds = mainWindow.getBounds();
  const res = { mainBounds: mainBounds };

  const displays = electron.screen.getAllDisplays();
  const { x: cursorX } = electron.screen.getCursorScreenPoint();
  const currentDisplay = displays.find((display, i) => {
    return (
      cursorX >= display.bounds.x &&
      cursorX <= display.bounds.x + display.bounds.width
    );
  });

  res.displayBounds = currentDisplay.bounds;
  res.cursorX = cursorX;
  res.displayWorkAreaSize = currentDisplay.workAreaSize;
  return res;
}
function setWindowSnapPosition(snapPosition) {
  if (snapPosition !== 'left' && snapPosition !== 'right') return;
  userData.snapPosition = snapPosition;

  const { displayBounds, displayWorkAreaSize } = getCurrentDisplayInfo();

  const x =
    snapPosition === 'left'
      ? displayBounds.x
      : displayBounds.x + displayBounds.width - DEFAULT_APP_WIDTH;

  const bounds = {
    x,
    y: 0,
    width: DEFAULT_APP_WIDTH,
    height: displayWorkAreaSize.height,
  };

  mainWindow.setBounds(getInsideBounds(bounds));

  writeUserDataFile();
}
ipc.on('toggleWindowPosition', function (event) {
  setWindowPosition(userData.snapPosition === 'left' ? 'right' : 'left');
});

function storeLastScreenshot(id, url) {
  userData.lastScreenshots[id] = url;
  writeUserDataFile();
}
function storeLastHomeScreenshot(id, url) {
  userData.lastHomeScreenshots[id] = url;
  writeUserDataFile();
}

function writeUserDataFile() {
  fs.writeFileSync(userDataJSONFilePath, JSON.stringify(userData));
}
ipc.on('updateUserData', function (event, data) {
  // change maxMemoryMB
  userData.maxMemoryMB = data.maxMemoryMB || userData.maxMemoryMB;
  // change showHotKey
  if (data.showHotKey && data.showHotKey !== userData.showHotKey) {
    if (userData.showHotKey && userData.showHotKey !== 'NONE') {
      globalShortcut.unregister(userData.showHotKey);
    }
    if (data.showHotKey && data.showHotKey !== 'NONE') {
      globalShortcut.register(data.showHotKey, handleHotKey);
    }
    userData.showHotKey = data.showHotKey;
  }
  // change lastUsedPlatformAlias
  userData.lastUsedPlatformAlias =
    data.lastUsedPlatformAlias || userData.lastUsedPlatformAlias;
  // change isStartWhenPCStart
  if (typeof data.isStartWhenPCStart !== 'undefined') {
    app.setLoginItemSettings({
      openAtLogin: data.isStartWhenPCStart,
    });
  }

  writeUserDataFile();
});

ipc.on('setAlwaysOnTop', function (event, data) {
  mainWindow.setAlwaysOnTop(data.value);
});

ipc.on('q1-hideApp', function () {
  //if (mainWindow.isVisible() && mainWindow.isFocused()) {
  if (!mainWindow.isMinimized() && mainWindow.isFocused()) {
    hideAppWindow();
  }
});

ipc.on('q1-appFocusBack', function () {
  if (isAppNotFocus()) return;
  mainWindow.webContents.focus();
  sendIPCToWindow(mainWindow, 'appFocusBack');
});

ipc.on('q1App-fullFocusBack', function () {
  focusToComposeBox();
});

ipc.on('q1App-quitAndInstall', function () {
  isExitApp = true;
  if (process.platform !== 'darwin') {
    mainWindow.minimize();
  }
  mainWindow.hide();
  if (process.platform === 'darwin') {
    app.hide();
  }
  deltaUpdater.quitAndInstall();
});
function toggleMaximizeUserAgent(id) {
  if (id !== 'go') return;
  const options = {
    userAgent: mainWindow.isMaximized()
      ? ''
      : SYSTEM_CONFIG.userAgentMeta.mobile_pixel,
  };
  const url = viewMap[id].webContents.getURL();
  viewMap[id].webContents.loadURL(url, options);
}
ipc.on('q1App-toggleMaximize', function () {
  // mainWindow.setResizable(true);
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.webContents.send('unmaximize');
  } else {
    mainWindow.maximize();
    mainWindow.webContents.send('maximize');
  }
  updateAllViewsBodyClass();
  // mainWindow.setResizable(false);
});

ipc.on('q1App-storeOpenAIAPIKey', function (e, value) {
  userData.openAIAPIKey = value;
  writeUserDataFile();
});

// it used by close button, normal Alt+1 is minimize
function hideWindow() {
  sendIPCToWindow(mainWindow, 'appHide');
  setTimeout(() => {
    if (process.platform !== 'darwin') {
      mainWindow.minimize();
    }
    mainWindow.hide();
    if (process.platform === 'darwin') {
      app.hide();
    }
  }, 25);
}
ipc.on('q1App-hideWindow', function () {
  hideWindow();
});

ipc.on('quit', function () {
  app.quit();
});

ipc.on('relaunchApp', function () {
  isExitApp = true;
  app.relaunch();
  app.exit();
});

function getUrlFileName(url) {
  const parts = url.split('/');
  if (parts.length <= 1) return url;
  return parts[parts.length - 1];
}
function extractCompressFile(filePath, destPath) {
  console.log('Extracting', filePath);
  if (filePath.endsWith('.7z')) {
    return extract7zip(filePath, destPath);
  }
  if (filePath.endsWith('.tar.gz')) {
    return tar.extract({ file: filePath, cwd: destPath });
  }
  if (filePath.endsWith('.zip')) {
    const zip = new AdmZip(filePath);
    zip.extractAllTo(destPath);
  }
}
const popularBinaryDownloadUrlMap = {
  ffmpeg: {
    binaryUrlLinux: '',
    binaryInsidePathLinux: '',
    binaryUrlWindows:
      'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    binaryInsidePathWindows: 'ffmpeg-master-latest-win64-gpl/bin',
    binaryUrlMac: 'https://evermeet.cx/ffmpeg/ffmpeg-6.0.7z',
    binaryInsidePathMac: '',
  },
  magick: {
    binaryUrlLinux: '',
    binaryInsidePathLinux: '',
    binaryUrlWindows: '',
    binaryInsidePathWindows: '',
    binaryUrlMac:
      'https://imagemagick.org/archive/binaries/ImageMagick-x86_64-apple-darwin20.1.0.tar.gz',
    binaryInsidePathMac: 'ImageMagick-7.0.10/bin',
    shouldAddCwdParam: true,
  },
};
function getDownloadUrlByCurPlatform(binaryInfoItem) {
  if (process.platform === 'win32') {
    return binaryInfoItem.binaryUrlWindows || '';
  } else if (process.platform === 'darwin') {
    return binaryInfoItem.binaryUrlMac || '';
  } else if (process.platform === 'linux') {
    return binaryInfoItem.binaryUrlLinux || '';
  }
  return '';
}
function getBinaryInsidePathByCurPlatform(binaryInfoItem) {
  if (!binaryInfoItem) return '';
  if (process.platform === 'win32') {
    return binaryInfoItem.binaryInsidePathWindows || '';
  } else if (process.platform === 'darwin') {
    return binaryInfoItem.binaryInsidePathMac || '';
  } else if (process.platform === 'linux') {
    return binaryInfoItem.binaryInsidePathLinux || '';
  }
  return '';
}
function fixPath(path) {
  return path.replace(/\\/g, '/').replace(/ /g, '\\\\ ');
}
function findAndReplaceBinaryPath(filePath, binaryInfo = {}) {
  const pySource = fs.readFileSync(filePath, 'utf-8');
  const operationLibFolderPath = path.join(operationParentFolderPath, 'lib');

  const binaryNames = [];
  const addCwdBinaries = [];
  const updatedPySource = pySource.replaceAll(
    /(subprocess.(?:call|run))\(([^\)]*)\)/g,
    function (...matches) {
      const [_, subprocessCaller, subprocessParam] = matches;
      let binaryFileName;
      const updatedSubprocessParam = subprocessParam.replace(
        /(f?)('|")([^\s'"]*)/,
        (...binaryPathMatches) => {
          const [_, f, quote, binaryPath] = binaryPathMatches;
          binaryFileName = getUrlFileName(binaryPath);
          binaryNames.push(binaryFileName);

          if (binaryInfo[binaryFileName]?.shouldAddCwdParam) {
            return `${f}${quote}${binaryFileName}`;
          }
          const updatedBinaryPath = path.join(
            operationLibFolderPath,
            binaryFileName,
            getBinaryInsidePathByCurPlatform(binaryInfo[binaryFileName]),
            binaryFileName,
          );
          return `${f}${quote}${fixPath(updatedBinaryPath)}`;
        },
      );
      if (binaryInfo[binaryFileName]?.shouldAddCwdParam) {
        addCwdBinaries.push({
          binaryFileName,
          cmd: `${subprocessCaller}(${updatedSubprocessParam})`,
        });
      }
      return `${subprocessCaller}(${updatedSubprocessParam})`;
    },
  );

  return {
    source: addCwd(updatedPySource, addCwdBinaries, binaryInfo),
    binaryNames,
  };
}
function addCwd(pySource, addCwdBinaries, binaryInfo) {
  const replacers = [];
  const matches = pySource.matchAll(/subprocess.(call|run)/g);
  [...matches].forEach((match) => {
    let count = match.index;
    let parenthesesCount = 0;
    let str = '';
    while (true) {
      if (count >= pySource.length) break;
      const w = pySource[count];
      str += w;
      if (w === '(') {
        parenthesesCount++;
      } else if (w === ')') {
        parenthesesCount--;
        if (parenthesesCount === 0) {
          break;
        }
      }
      count++;
    }
    if (str.includes('cwd=')) return;
    // to reuse binaryFileName have been found in findAndReplaceBinaryPath
    const addCwdInfo = addCwdBinaries.find(({ binaryFileName, cmd }) =>
      str.includes(cmd),
    );
    if (!addCwdInfo) return;
    const { binaryFileName } = addCwdInfo;
    const operationLibFolderPath = path.join(operationParentFolderPath, 'lib');
    const updatedBinaryPath = path.join(
      operationLibFolderPath,
      binaryFileName,
      getBinaryInsidePathByCurPlatform(binaryInfo[binaryFileName]),
    );
    const cwdPath = replacers.push({
      oldStr: str,
      newStr: `${str.substring(0, str.length - 1)},cwd='${updatedBinaryPath}')`,
    });
  });
  let res = pySource;
  replacers.forEach(({ oldStr, newStr }) => {
    res = res.replace(oldStr, newStr);
  });
  return res;
}
function downloadOperationBinaries(binaryInfo) {
  // create UserData/Operation/lib dir
  const operationLibFolderPath = path.join(operationParentFolderPath, 'lib');
  if (!fs.existsSync(operationLibFolderPath)) {
    fs.mkdirSync(operationLibFolderPath);
  }
  // check if exist and download
  const downloadPromises = [];
  Object.keys(binaryInfo).forEach((binaryName) => {
    // skip if lib is already downloaded
    const libPath = path.join(operationLibFolderPath, binaryName);
    if (fs.existsSync(libPath)) return;
    const binaryDownloadUrl = getDownloadUrlByCurPlatform(
      binaryInfo[binaryName],
    );
    if (!binaryDownloadUrl) return;

    const downloadFileName = getUrlFileName(binaryDownloadUrl);
    const downloadFilePath = path.join(
      operationLibFolderPath,
      downloadFileName,
    );
    const promise = downloadFile(
      binaryDownloadUrl,
      downloadFilePath,
      ({ percentage, transferred, total }) => {
        console.log(
          `Download lib ${downloadFileName}: ${transferred} / ${total} (${percentage}%)`,
        );
      },
    )
      .then(() => {
        console.log(`Download lib ${downloadFileName} done`);
        fs.mkdirSync(libPath);
        return extractCompressFile(downloadFilePath, libPath);
      })
      .then(() => {
        console.log(`Remove ${downloadFileName}`);
        fs.unlinkSync(downloadFilePath);
      });
    downloadPromises.push(promise);
  });

  return Promise.all(downloadPromises);
}
ipc.on('q1App-createOperation', function (e, data) {
  // copy main file to UserData/Operation/operations
  const operationsFolderPath = path.join(
    operationParentFolderPath,
    'operations',
  );
  const newOperationFilePath = path.join(
    operationsFolderPath,
    `O${userData.nextOperationId}.py`,
  );
  fs.copyFileSync(data.filePath, newOperationFilePath);
  // save new operation to userData file
  userData.operations.push({
    id: userData.nextOperationId,
    name: data.name,
    binaryInfo: data.binaryInfo,
  });
  userData.nextOperationId += 1;
  // update app operation list
  sendIPCToWindow(mainWindow, 'q1App-receiveOperationList', {
    operations: userData.operations,
  });
  writeUserDataFile();
  const { source } = findAndReplaceBinaryPath(data.filePath, data.binaryInfo);
  fs.writeFileSync(newOperationFilePath, source);
  downloadOperationBinaries(data.binaryInfo);
});

ipc.on('q1App-findBinaries', async function (e, data) {
  const { binaryNames } = findAndReplaceBinaryPath(data.filePath);
  const res = {};
  binaryNames.forEach((binaryName) => {
    const binaryDownloadUrls = popularBinaryDownloadUrlMap[binaryName] || {
      binaryUrlLinux: '',
      binaryInsidePathLinux: '',
      binaryUrlWindows: '',
      binaryInsidePathWindows: '',
      binaryUrlMac: '',
      binaryInsidePathMac: '',
    };
    res[binaryName] = binaryDownloadUrls;
  });
  const resStr = JSON.stringify(res);
  sendIPCToWindow(mainWindow, 'q1App-resultBinaries', resStr);
});

function runOperationServer() {
  // create UserData/Operation dir
  if (!fs.existsSync(operationParentFolderPath)) {
    fs.mkdirSync(operationParentFolderPath);
  }
  // init python server: UserData/Operation/main.py
  const mainPyPath = path.join(operationParentFolderPath, 'main.py');
  if (!fs.existsSync(mainPyPath)) {
    const defaultMainPyPath = path.join(
      app.getAppPath(),
      '/data/operation-server/default-main.py',
    );
    fs.copyFileSync(defaultMainPyPath, mainPyPath);
  }
  // init python server: UserData/Operation/operations
  const operationsFolderPath = path.join(
    operationParentFolderPath,
    'operations',
  );
  if (!fs.existsSync(operationsFolderPath)) {
    fs.mkdirSync(operationsFolderPath);
  }
  // create python server: UserData/Operation/operations/__init__.py
  const initPyPath = path.join(operationsFolderPath, '__init__.py');
  if (!fs.existsSync(initPyPath)) {
    const defaultInitPyPath = path.join(
      app.getAppPath(),
      '/data/operation-server/default-init.py',
    );
    fs.copyFileSync(defaultInitPyPath, initPyPath);
  }
  // run the server
  const pythonCmd = `python${process.platform === 'win32' ? '' : '3'}`;
  exec(`cd "${operationParentFolderPath}" && ${pythonCmd} main.py`, (error) => {
    console.log('Operation Server Error:', error);
  });
}

async function quitAndRunOperationServer() {
  try {
    const res = await fetch('http://localhost:8000/shutdown');
    const resJson = await res.json();
    console.log(resJson);
  } catch (e) {
    if (!e.message.includes('ECONNREFUSED')) {
      console.log(e.message);
    }
  }
  runOperationServer();
}

function toggleWindowVisible() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
    showAppWindow();
  } else {
    hideAppWindow();
  }
}
function createTray() {
  mainTray = new Tray(__dirname + '/icons/icon16.png');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', type: 'normal', click: () => toggleWindowVisible() },
    {
      label: 'Restart',
      type: 'normal',
      click: () => {
        destroyAllViews();
        isExitApp = true;
        app.relaunch();
        app.exit();
      },
    },
    {
      label: 'Exit',
      type: 'normal',
      click: () => {
        isExitApp = true;
        app.quit();
      },
    },
  ]);
  mainTray.setToolTip('Qute');
  mainTray.setContextMenu(contextMenu);
  mainTray.on('click', toggleWindowVisible);
}

onExtendedProcessMetrics(app, { samplingInterval: 1000 }).subscribe(
  (report) => {
    let totalMemory = 0;
    report.forEach((task) => {
      // there is some different compare to the RAM in TaskManager
      if (process.platform === 'darwin') {
        totalMemory +=
          task.memory.workingSetSize / SYSTEM_CONFIG.memoryMultiplierMac +
          SYSTEM_CONFIG.memoryOffsetMac;
      } else if (process.platform === 'win32') {
        totalMemory +=
          task.memory.privateBytes / SYSTEM_CONFIG.memoryMultiplierWin +
          SYSTEM_CONFIG.memoryOffsetWin;
      } else {
        totalMemory +=
          task.memory.workingSetSize / SYSTEM_CONFIG.memoryMultiplierLinux +
          SYSTEM_CONFIG.memoryOffsetLinux;
      }
    });

    let totalMemoryMB = totalMemory / 1024;
    if (totalMemoryMB > userData.maxMemoryMB) {
      mainWindow.webContents.send('destroyOldestTab');
    }
    if (SYSTEM_CONFIG.shouldShowTotalMemory) {
      console.log('total', totalMemoryMB.toFixed(2), 'MB');
    }
  },
);

const TIME_THRESHOLD = 2; // 5;
let timeInThresholdCounter = 0;
let showedMenuBar = false;
let isWindowFullscreen = false;
function isCursorInArea(x, y, mainBounds, h) {
  return (
    x >= mainBounds.x + getAppMargin() &&
    x <= mainBounds.x + mainBounds.width + getAppMargin() &&
    y >= mainBounds.y + getAppMargin() &&
    y <= mainBounds.y + h + getAppMargin()
  );
}
function isCursorInTopMenuBar(x, y, mainBounds) {
  return isCursorInArea(x, y, mainBounds, q1LayoutSize.baseTopMenuBarHeight);
}
function isCursorInThreshold(x, y, mainBounds) {
  // return isCursorInArea(x, y, mainBounds, edgeDistanceThreshold);
  return isCursorInArea(x, y, mainBounds, q1LayoutSize.baseTopMenuBarHeight);
}
setInterval(() => {
  if (!mainWindow) return;
  if (isWindowFullscreen) return;
  const { x, y } = electron.screen.getCursorScreenPoint();
  const mainBounds = mainWindow.getBounds();
  if (showedMenuBar) {
    if (!isCursorInTopMenuBar(x, y, mainBounds)) {
      // sendIPCToWindow(mainWindow, 'q1-hideMenuBar');
      sendIPCToWindow(mainWindow, 'q1-appHideMenuButton');
      showedMenuBar = false;
    }
    return;
  }
  if (isCursorInThreshold(x, y, mainBounds)) {
    timeInThresholdCounter++;
    if (timeInThresholdCounter >= TIME_THRESHOLD) {
      showedMenuBar = true;
      timeInThresholdCounter = 0;
      // sendIPCToWindow(mainWindow, 'q1-showMenuBar');
      sendIPCToWindow(mainWindow, 'q1-appShowMenuButton');
    }
  } else {
    timeInThresholdCounter = 0;
  }
}, 100);

const ZOOM_LEVEL_MAP = {
  max: {
    gp: 0.93,
    cl: 0.95,
    bi: 1.0,
    ba: 1.0,
    po: 0.89,
    ch: 1.0,
    pi: 1.0,
    hu: 1.0,
    pe: 1.0,
    go: 1.0,
  },
  1080: {
    gp: 0.93,
    cl: 0.95,
    bi: 1.0,
    ba: 1.0,
    po: 0.89,
    ch: 1.0,
    pi: 1.0,
    hu: 1.0,
    pe: 1.0,
    go: 1.0,
  },
  992: {
    gp: 0.92,
    cl: 0.93,
    bi: 0.9,
    ba: 0.9,
    po: 0.9,
    ch: 0.9,
    pi: 0.92,
    hu: 0.92,
    pe: 0.92,
    go: 0.92,
  },
  900: {
    gp: 0.9,
    cl: 0.92,
    bi: 0.9,
    ba: 0.9,
    po: 0.88,
    ch: 0.9,
    pi: 0.9,
    hu: 0.92,
    pe: 0.9,
    go: 0.9,
  },
  768: {
    gp: 0.77,
    cl: 0.8,
    bi: 0.8,
    ba: 0.8,
    po: 0.77,
    ch: 0.8,
    pi: 0.77,
    hu: 0.8,
    pe: 0.8,
    go: 0.8,
  },
  0: {
    gp: 0.7,
    cl: 0.8,
    bi: 0.8,
    ba: 0.8,
    po: 0.65,
    ch: 0.65,
    pi: 0.7,
    hu: 0.7,
    pe: 0.8,
    go: 0.8,
  },
  mini: {
    gp: 0.7,
    cl: 0.8,
    bi: 0.8,
    ba: 0.8,
    po: 0.65,
    ch: 0.65,
    pi: 0.7,
    hu: 0.7,
    pe: 0.8,
    go: 0.8,
  },
};
function getWebviewZoomLevel(platformAlias) {
  var { height } = getPrimaryScreenBounds();
  if (mainWindow.isMaximized()) {
    return ZOOM_LEVEL_MAP.max[platformAlias] || 1;
  } else if (mainWindowIsMiniMode) {
    return ZOOM_LEVEL_MAP.mini[platformAlias] || 0.7;
  } else if (height >= 1080) {
    return ZOOM_LEVEL_MAP[1080][platformAlias] || 1;
  }
  if (height >= 992) {
    return ZOOM_LEVEL_MAP[992][platformAlias] || 0.9;
  }
  if (height >= 900) {
    return ZOOM_LEVEL_MAP[900][platformAlias] || 0.9;
  }
  if (height >= 768) {
    return ZOOM_LEVEL_MAP[768][platformAlias] || 0.8;
  }
  return ZOOM_LEVEL_MAP[0][platformAlias] || 0.7;
}
function getRendererBodyClass() {
  const { height } = getPrimaryScreenBounds();
  let className = '';
  if (mainWindow.isMaximized()) {
    className = 'sh-max';
  } else if (mainWindowIsMiniMode) {
    className = 'sh-mini';
  } else if (height >= 1080) {
    className = 'sh-1080';
  } else if (height >= 992) {
    className = 'sh-992';
  } else if (height >= 900) {
    className = 'sh-900';
  } else if (height >= 768) {
    className = 'sh-768';
  }
  return { className };
}
async function updateAllViewsBodyClass(shouldDelay) {
  if (shouldDelay) {
    await wait(25);
  }
  for (const id in viewMap) {
    toggleMaximizeUserAgent(id);
    viewMap[id].webContents.setZoomFactor(getWebviewZoomLevel(id));
    viewMap[id].webContents.send('q1-screenSizeClass', getRendererBodyClass());
  }
  [
    mainWindow,
    q1HelpView,
    q1AutosuggestView,
    q1PopupView,
    q1ActionsBarView,
  ].forEach((view) => {
    if (!view) return;
    if (view === q1HelpView) {
      q1HelpView.setBounds(getQ1HelpBounds(true));
    } else if (view === q1AutosuggestView) {
      q1AutosuggestView.setBounds(getWebviewBounds());
    } else if (view === q1PopupView) {
      q1PopupView.setBounds(getQ1PopupBounds());
    }
    view.webContents.send('q1-screenSizeClass', getRendererBodyClass());
  });
}

function isGreaterVersion(versionA, versionB) {
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

function extract7zip(zipPath, extractedDir) {
  return new Promise((resolve, reject) => {
    const zipStream = extractFull(zipPath, extractedDir, {
      recursive: true,
      $bin: pathTo7zip,
    });

    zipStream.on('error', (err) => {
      console.log('Error extracting: ', err);
      reject(err);
    });

    zipStream.on('end', () => {
      console.log('Extracting completed\n');
      resolve(extractedDir);
    });
  });
}

function sendLocalBaseInstallState(state) {
  const localBaseView = viewMap['local'];
  if (!localBaseView) return;
  localBaseView.webContents.send('q1View-localBaseInstallState', state);
}
function installNiceGui() {
  const localBaseView = viewMap['local'];
  const installProcess = spawn('pip', ['install', 'nicegui']);
  installProcess.on('exit', function (code) {
    if (code !== 0) return;
    console.log('nicegui is installed');
    quitAndRunOperationServer();
    sendLocalBaseInstallState('installed');
  });
}
ipc.on('q1App-checkLocalBaseInstalled', () => {
  const checkProcess = spawn('pip', ['list']);
  let listResult = [];
  checkProcess.stdout.on('data', function (data) {
    listResult = [
      ...listResult,
      ...data
        .toString()
        .split('\n')
        .filter((line) => line.trim() !== ''),
    ];
  });
  checkProcess.on('exit', function () {
    if (listResult.some((line) => line.startsWith('nicegui'))) {
      sendLocalBaseInstallState('installed');
    } else {
      console.log('nicegui is installing');
      installNiceGui();
      sendLocalBaseInstallState('installing');
    }
  });
});

function wait(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
