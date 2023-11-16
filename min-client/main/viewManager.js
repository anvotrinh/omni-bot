const BrowserView = electron.BrowserView;

var viewMap = {}; // id: view
var viewStateMap = {}; // id: view state
var selectedView = null;
var viewSelectionTextMap = {};

var q1HelpView = null;
var q1AutosuggestView = null;
var q1PopupView = null;
var q1OverlayView = null;
var q1ActionsBarView = null;
var q1ShouldShowMenuBar = true;

var temporaryPopupViews = {}; // id: view

const defaultViewWebPreferences = {
  nodeIntegration: false,
  nodeIntegrationInSubFrames: true,
  scrollBounce: true,
  safeDialogs: true,
  safeDialogsMessage: 'Prevent this page from creating additional dialogs',
  preload: __dirname + '/dist/preload.js',
  contextIsolation: true,
  sandbox: true,
  enableRemoteModule: false,
  allowPopups: false,
  // partition: partition || 'persist:webcontent',
  enableWebSQL: false,
  autoplayPolicy: settings.get('enableAutoplay')
    ? 'no-user-gesture-required'
    : 'user-gesture-required',
  // match Chrome's default for anti-fingerprinting purposes (Electron defaults to 0)
  minimumFontSize: 6,
};

const getCenterPosition = (webviewBounds, width, height) => {
  const x = Math.round(webviewBounds.x + (webviewBounds.width - width) / 2);
  const y = Math.round(webviewBounds.y + (webviewBounds.height - height) / 2);
  return { x, y };
};

function getWebviewBounds() {
  const mainBounds = mainWindow.getBounds();
  return {
    x: getAppMargin(),
    y: getAppMargin() + q1LayoutSize.topMenuBarHeight,
    width: mainBounds.width - 2 * getAppMargin(),
    height:
      mainBounds.height -
      2 * getAppMargin() -
      q1LayoutSize.topMenuBarHeight -
      q1LayoutSize.height,
  };
}
function getStaticWebviewBounds() {
  const mainBounds = mainWindow.getBounds();
  return {
    x: getAppMargin(),
    y: getAppMargin() + 40,
    width: mainBounds.width - 2 * getAppMargin(),
    height: mainBounds.height - 2 * getAppMargin() - 120,
  };
}

const q1HelpHTMLFile = 'file://' + __dirname + '/q1Help.html';
function getQ1HelpBounds(resetHeight) {
  const widthRatio = mainWindow.isMaximized() ? 0.3 : 0.64;
  const heightRatio = 0.73;
  const bounds = q1HelpView.getBounds();

  const staticWebviewBounds = getStaticWebviewBounds();
  const width =
    Math.round(staticWebviewBounds.width * widthRatio) + 2 * getAppMargin();
  let height;
  if (bounds.height && !resetHeight) {
    height = bounds.height;
  } else {
    height =
      Math.round(staticWebviewBounds.height * heightRatio) + 2 * getAppMargin();
  }
  const { x, y } = getCenterPosition(staticWebviewBounds, width, height);
  return { x, y, width, height };
}
function createQ1Help() {
  q1HelpView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.addBrowserView(q1HelpView);
  q1HelpView.setBounds(getQ1HelpBounds());
  q1HelpView.webContents.loadURL(q1HelpHTMLFile);

  q1HelpView.webContents.on('did-finish-load', function () {
    q1HelpView.webContents.send('q1-screenSizeClass', getRendererBodyClass());
    q1HelpView.webContents.send('q1View-setShowPopupHelpPage', {
      shouldShowPopup: !userData.isCompletedHelpTutorial,
    });
  });

  if (SYSTEM_CONFIG.shouldOpenHelpDevTool) {
    q1HelpView.webContents.openDevTools({ mode: 'undocked' });
  }
}
function destroyCustomView(view) {
  if (!view) return;

  if (q1HelpView === view) {
    q1HelpView = null;
  } else if (q1OverlayView === view) {
    q1OverlayView = null;
  } else if (q1PopupView === view) {
    q1PopupView = null;
  } else if (q1AutosuggestView === view) {
    q1AutosuggestView = null;
  } else if (q1ActionsBarView === view) {
    q1ActionsBarView = null;
  } else {
    return;
  }

  const browserViews = mainWindow.getBrowserViews();
  if (browserViews.includes(view)) {
    mainWindow.removeBrowserView(view);
  }
  view.webContents.destroy();
}

const q1AutosuggestHTMLFile = 'file://' + __dirname + '/q1Autosuggest.html';
function createQ1Autosuggest() {
  q1AutosuggestView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  q1AutosuggestView.setBounds(getWebviewBounds());
  q1AutosuggestView.webContents.loadURL(q1AutosuggestHTMLFile);
  if (SYSTEM_CONFIG.shouldOpenAutosuggestDevTool) {
    q1AutosuggestView.webContents.openDevTools({ mode: 'undocked' });
  }
}

const q1PopupHTMLFile = 'file://' + __dirname + '/q1Popup.html';
function getQ1PopupSize() {
  var { height } = getPrimaryScreenBounds();
  if (mainWindow.isMaximized()) {
    return { width: 556, height: 156 };
  }
  if (height >= 1080) {
    return { width: 371, height: 104 };
  }
  if (height >= 992) {
    return { width: 363, height: 102 };
  }
  if (height >= 900) {
    return { width: 333, height: 101 };
  }
  if (height >= 768) {
    return { width: 333, height: 101 };
  }
  return { width: 300, height: 90 };
}
function getQ1PopupBounds() {
  const webviewBounds = getWebviewBounds();

  const { width, height } = getQ1PopupSize();

  const btnWidth = q1LayoutSize.baseTopMenuBarHeight - 6; // 6px padding
  let btnsWidth = 16 + 4.5 * btnWidth + 12 * 4;
  if (SYSTEM_CONFIG.maximizeEnabled) {
    btnsWidth = 16 + 5.5 * btnWidth + 12 * 5; // (padding left 16px) + (button width * 5.5) + (12px gap * 5)
  }
  const x = Math.round(
    webviewBounds.x + webviewBounds.width - btnsWidth - width / 2,
  );
  const y = q1LayoutSize.baseTopMenuBarHeight + getAppMargin();
  return { x, y, width, height };
}
function createQ1Popup() {
  q1PopupView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.addBrowserView(q1PopupView);
  q1PopupView.setBounds(getQ1PopupBounds());
  q1PopupView.webContents.loadURL(q1PopupHTMLFile);

  q1PopupView.webContents.on('did-finish-load', function () {
    q1PopupView.webContents.send('q1-screenSizeClass', getRendererBodyClass());
  });

  if (SYSTEM_CONFIG.shouldOpenPopupDevTool) {
    q1PopupView.webContents.openDevTools({ mode: 'undocked' });
  }
}

const q1OverlayHTMLFile = 'file://' + __dirname + '/q1Overlay.html';
function createQ1OverlayView() {
  q1OverlayView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  mainWindow.addBrowserView(q1OverlayView);
  q1OverlayView.setBounds(getWebviewBounds());
  q1OverlayView.webContents.loadURL(q1OverlayHTMLFile);
}

function q1ActionsBarBoundsUpdate(bounds) {
  const wBounds = getWebviewBounds();
  bounds.x = clamp(
    bounds.x,
    wBounds.x,
    wBounds.x + wBounds.width - bounds.width,
  );
  bounds.y = clamp(
    bounds.y,
    wBounds.y,
    wBounds.y + wBounds.height - bounds.height,
  );
  q1ActionsBarView.setBounds(bounds);
}

const q1ActionsBarHTMLFile = 'file://' + __dirname + '/q1ActionsBar.html';
function createQ1ActionsBar(bounds) {
  console.log('create actionsBar');
  q1ActionsBarView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  q1ActionsBarBoundsUpdate(bounds);
  q1ActionsBarView.webContents.loadURL(q1ActionsBarHTMLFile);
  q1ActionsBarView.webContents.on('did-finish-load', function () {
    q1ActionsBarView.webContents.send(
      'q1-screenSizeClass',
      getRendererBodyClass(),
    );
  });

  if (SYSTEM_CONFIG.shouldOpenActionsBarDevTool) {
    q1ActionsBarView.webContents.openDevTools({ mode: 'undocked' });
  }
}

function createView(
  existingViewId,
  id,
  webPreferencesString,
  boundsString,
  events,
) {
  viewStateMap[id] = { loadedInitialURL: false };

  let view;
  if (existingViewId) {
    view = temporaryPopupViews[existingViewId];
    delete temporaryPopupViews[existingViewId];

    // the initial URL has already been loaded, so set the background color
    // view.setBackgroundColor('#fff');
    viewStateMap[id].loadedInitialURL = true;
  } else {
    let webPreferences;
    if (id.startsWith('url')) {
      webPreferences = { ...defaultViewWebPreferences };
    } else {
      webPreferences = Object.assign(
        {},
        defaultViewWebPreferences,
        JSON.parse(webPreferencesString),
      );
    }
    if (id === 'interpreter') {
      webPreferences = {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      };
    }
    webPreferences.zoomFactor = getWebviewZoomLevel(id);
    view = new BrowserView({
      webPreferences,
    });
  }

  view.webContents.once('did-finish-load', function () {
    view.webContents.zoomFactor = getWebviewZoomLevel(id);
    view.webContents.send('q1-screenSizeClass', getRendererBodyClass());
  });

  events.forEach(function (event) {
    view.webContents.on(event, function (e) {
      var args = Array.prototype.slice.call(arguments).slice(1);

      mainWindow.webContents.send('view-event', {
        viewId: id,
        event: event,
        args: args,
      });
    });
  });

  view.webContents.on(
    'select-bluetooth-device',
    function (event, deviceList, callback) {
      event.preventDefault();
      callback('');
    },
  );

  view.webContents.setWindowOpenHandler(function (details) {
    /*
      Opening a popup with window.open() generally requires features to be set
      So if there are no features, the event is most likely from clicking on a link, which should open a new tab.
      Clicking a link can still have a "new-window" or "foreground-tab" disposition depending on which keys are pressed
      when it is clicked.
      (https://github.com/minbrowser/min/issues/1835)
    */
    if (!details.features) {
      mainWindow.webContents.send('view-event', {
        viewId: id,
        event: 'new-tab',
        args: [details.url, !(details.disposition === 'background-tab')],
      });
      return {
        action: 'deny',
      };
    }

    return {
      action: 'allow',
    };
  });

  view.webContents.removeAllListeners('-add-new-contents');

  view.webContents.on(
    '-add-new-contents',
    function (
      e,
      webContents,
      disposition,
      _userGesture,
      _left,
      _top,
      _width,
      _height,
      url,
      frameName,
      referrer,
      rawFeatures,
      postData,
    ) {
      if (!filterPopups(url)) {
        return;
      }

      const webPreferences = { ...defaultViewWebPreferences };
      webPreferences.zoomFactor = getWebviewZoomLevel(id);
      var view = new BrowserView({
        webPreferences,
        webContents: webContents,
      });

      var popupId = Math.random().toString();
      temporaryPopupViews[popupId] = view;

      mainWindow.webContents.send('view-event', {
        viewId: id,
        event: 'did-create-popup',
        args: [popupId, url],
      });

      view.webContents.on('destroyed', function (e) {
        mainWindow.webContents.send('view-event', {
          viewId: id,
          event: 'did-close-popup',
        });
      });
    },
  );

  view.webContents.on('ipc-message', function (e, channel, data) {
    var senderURL;
    try {
      senderURL = e.senderFrame.url;
    } catch (err) {
      // https://github.com/minbrowser/min/issues/2052
      console.warn(
        'dropping message because senderFrame is destroyed',
        channel,
        data,
        err,
      );
      return;
    }
    mainWindow.webContents.send('view-ipc', {
      id: id,
      name: channel,
      data: data,
      frameId: e.frameId,
      frameURL: senderURL,
    });
  });

  // Open a login prompt when site asks for http authentication
  view.webContents.on(
    'login',
    (event, authenticationResponseDetails, authInfo, callback) => {
      if (authInfo.scheme !== 'basic') {
        // Only for basic auth
        return;
      }
      event.preventDefault();
      var title = l('loginPromptTitle')
        .replace('%h', authInfo.host)
        .replace('%r', authInfo.realm);
      createPrompt(
        {
          text: title,
          values: [
            { placeholder: l('username'), id: 'username', type: 'text' },
            { placeholder: l('password'), id: 'password', type: 'password' },
          ],
          ok: l('dialogConfirmButton'),
          cancel: l('dialogSkipButton'),
          width: 400,
          height: 200,
        },
        function (result) {
          // resend request with auth credentials
          callback(result.username, result.password);
        },
      );
    },
  );

  // show an "open in app" prompt for external protocols

  function handleExternalProtocol(
    e,
    url,
    isInPlace,
    isMainFrame,
    frameProcessId,
    frameRoutingId,
  ) {
    var knownProtocols = [
      'http',
      'https',
      'file',
      'min',
      'about',
      'data',
      'javascript',
      'chrome',
    ]; // TODO anything else?
    if (!knownProtocols.includes(url.split(':')[0])) {
      var externalApp = app.getApplicationNameForProtocol(url);
      if (externalApp) {
        // TODO find a better way to do this
        // (the reason to use executeJS instead of the Electron dialog API is so we get the "prevent this page from creating additional dialogs" checkbox)
        var sanitizedName = externalApp.replace(/[^a-zA-Z0-9.]/g, '');
        if (view.webContents.getURL()) {
          view.webContents
            .executeJavaScript(
              'confirm("' +
                l('openExternalApp').replace('%s', sanitizedName) +
                '")',
            )
            .then(function (result) {
              if (result === true) {
                electron.shell.openExternal(url);
              }
            });
        } else {
          // the code above tries to show the dialog in a browserview, but if the view has no URL, this won't work.
          // so show the dialog globally as a fallback
          var result = electron.dialog.showMessageBoxSync({
            type: 'question',
            buttons: ['OK', 'Cancel'],
            message: l('openExternalApp')
              .replace('%s', sanitizedName)
              .replace(/\\/g, ''),
          });

          if (result === 0) {
            electron.shell.openExternal(url);
          }
        }
      }
    }
  }

  view.webContents.on('did-start-navigation', handleExternalProtocol);
  /*
  It's possible for an HTTP request to redirect to an external app link
  (primary use case for this is OAuth from desktop app > browser > back to app)
  and did-start-navigation isn't (always?) emitted for redirects, so we need this handler as well
  */
  view.webContents.on('will-redirect', handleExternalProtocol);

  if (id === 'local') {
    view.webContents.on(
      'did-fail-load',
      function (e, errorCode, errorDescription, validatedURL, isMainFrame) {
        if (!isMainFrame) return;
        setTimeout(() => {
          view.webContents.reload();
        }, 500);
      },
    );
  }

  if (id === 'interpreter') {
    if (SYSTEM_CONFIG.shouldOpenInterpreterDevTool) {
      view.webContents.openDevTools();
    }
  }

  if (id === 'ch') {
    mainWindow.addBrowserView(view);
  }

  view.setBounds(JSON.parse(boundsString));

  if (id === 'ch') {
    mainWindow.removeBrowserView(view);
  }

  viewMap[id] = view;

  return view;
}

function destroyView(id) {
  if (!viewMap[id]) {
    return;
  }

  const browserViews = mainWindow.getBrowserViews();
  if (browserViews.includes(viewMap[id])) {
    mainWindow.removeBrowserView(viewMap[id]);
    selectedView = null;
  }
  viewMap[id].webContents.destroy();

  delete viewMap[id];
  delete viewStateMap[id];
}

function destroyAllViews() {
  for (const id in viewMap) {
    destroyView(id);
  }
  destroyCustomView(q1HelpView);
  destroyCustomView(q1PopupView);
  destroyCustomView(q1AutosuggestView);
  destroyCustomView(q1OverlayView);
  destroyCustomView(q1ActionsBarView);
  // shutdown python server for operations
  fetch('http://localhost:8000/shutdown');
  killAllInterpreterProcess();
  getBackgroundAppProcess && getBackgroundAppProcess.kill();
}

function setView(id) {
  // setBrowserView causes flickering, so we only want to call it if the view is actually changing
  // see https://github.com/minbrowser/min/issues/1966
  const browserViews = mainWindow.getBrowserViews();
  if (!browserViews.includes(viewMap[id])) {
    if (selectedView && viewMap[selectedView]) {
      mainWindow.removeBrowserView(viewMap[selectedView]);
    }
    if (viewStateMap[id].loadedInitialURL) {
      mainWindow.addBrowserView(viewMap[id]);
    }
    selectedView = id;
  }
  if (q1HelpView && mainWindow.getBrowserViews().includes(q1HelpView)) {
    q1HelpView.setBounds(getQ1HelpBounds());
    mainWindow.setTopBrowserView(q1HelpView);
  }
  if (
    q1AutosuggestView &&
    mainWindow.getBrowserViews().includes(q1AutosuggestView)
  ) {
    q1AutosuggestView.setBounds(getWebviewBounds());
    mainWindow.setTopBrowserView(q1AutosuggestView);
  }
  if (q1PopupView && mainWindow.getBrowserViews().includes(q1PopupView)) {
    q1PopupView.setBounds(getQ1PopupBounds());
    mainWindow.setTopBrowserView(q1PopupView);
  }
}

function setBounds(id, bounds, isFullscreen) {
  if (viewMap[id]) {
    viewMap[id].setBounds(getWebviewBounds());
  }
}

function focusView(id) {
  // empty views can't be focused because they won't propogate keyboard events correctly, see https://github.com/minbrowser/min/issues/616
  // also, make sure the view exists, since it might not if the app is shutting down
  if (
    viewMap[id] &&
    (viewMap[id].webContents.getURL() !== '' ||
      viewMap[id].webContents.isLoading())
  ) {
    viewMap[id].webContents.focus();
  } else if (mainWindow) {
    mainWindow.webContents.focus();
  }
}

function hideCurrentView() {
  if (selectedView && viewMap[selectedView]) {
    mainWindow.removeBrowserView(viewMap[selectedView]);
  }
  selectedView = null;
  // mainWindow.webContents.focus();
}

function getView(id) {
  return viewMap[id];
}

function getViewIDFromWebContents(contents) {
  for (var id in viewMap) {
    if (viewMap[id].webContents === contents) {
      return id;
    }
  }
}

ipc.on('createView', function (e, args) {
  createView(
    args.existingViewId,
    args.id,
    args.webPreferencesString,
    args.boundsString,
    args.events,
  );
});

function getInputDOMFuncStr(id) {
  if (id === 'go') {
    return `
document.q1_main_input = document.getElementsByName('q')[0];
document.q1_main_form = document.querySelector('form[action="/search"]');`;
  }
  return '';
}
const fetchSuggestionInfos = {
  yt: {
    url: 'https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&q=',
    getResult: (res) => res[1],
    results: {},
  },
};
function fetchSuggestionAPI(alias, search) {
  if (!search) return Promise.resolve([]);
  const info = fetchSuggestionInfos[alias];
  if (!info) return Promise.resolve([]);
  // get the stored result
  const storedResult = info.results[search];
  if (storedResult) {
    return Promise.resolve(storedResult);
  }

  const { url, getResult } = info;
  return fetch(`${url}${search}`)
    .then((res) => res.text())
    .then((resText) => {
      const resJSON = JSON.parse(resText);
      const suggestionTexts = getResult(resJSON);
      // store result
      info.results[search] = suggestionTexts;
      return suggestionTexts;
    });
}
function q1InputUpdateJS(e, args, isSendEachChar, forceEmptyInput) {
  if (!args.event.value && !forceEmptyInput) return Promise.resolve();

  if (args.event.tabAlias === 'yt') {
    fetchSuggestionAPI(args.event.tabAlias, args.event.value).then(
      (suggestionTexts) => {
        sendIPCToWindow(mainWindow, 'apiAutosuggestion', {
          data: suggestionTexts.map((text) => ({
            name: text,
            decs: '',
            icon: '',
          })),
          tabAlias: args.event.tabAlias,
        });
      },
    );
    return Promise.resolve();
  }
  return viewMap[args.id].webContents.executeJavaScript(
    `
      ${getInputDOMFuncStr(args.id)}
      inputElement = null;
      if(document.q1_main_input)
        inputElement = document.q1_main_input;
      else if (document.q1_main_input_code){
        inputElement = eval(document.q1_main_input_code)
      } else if (document.q1_main_input_func) {
        inputElement = document.q1_main_input_func()
      }
      if(inputElement){
        inputElement.focus();
        ${
          isSendEachChar
            ? '[!!inputElement, inputElement.value];'
            : `
          inputElement.value = \`${args.event.value
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')}\`;
          inputElement.dispatchEvent(
            new Event("input", { bubbles: true, cancelable: true })
          );
        `
        }
      }
      `,
  );
}
function q1SubmitJS(e, args) {
  return viewMap[args.id].webContents.executeJavaScript(`
  if(document.q1_main_submit_button){
    document.q1_main_submit_button.click();
  } else if (document.q1_main_form){
    document.q1_main_form.submit();
  } else if (document.q1_main_form_code){
    element = eval(document.q1_main_form_code);
    element.submit();
  } else if (document.q1_main_submit_button_code){
    element = eval(document.q1_main_submit_button_code);
    element && element.click();
  } else if (document.q1_main_submit_button_func) {
    element = document.q1_main_submit_button_func()
    element && element.click();
  } else {
    inputElement = null;
    if(document.q1_main_input)
      inputElement = document.q1_main_input;
    else if (document.q1_main_input_code){
      inputElement = eval(document.q1_main_input_code)
    }
    if(inputElement){
      inputElement.focus();
      inputElement.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':13}));
    }
  }
`);
}
function q1SubmitAndEnter(e, args) {
  return q1SubmitJS(e, args)
    .then(() => {
      const shouldEnterChar = ['pi'].includes(args.id);
      if (!shouldEnterChar) return;
      const { webContents } = viewMap[args.id];
      webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: 'Enter',
      });
      webContents.sendInputEvent({
        type: 'char',
        keyCode: 'Enter',
      });
      webContents.sendInputEvent({
        type: 'keyUp',
        keyCode: 'Enter',
      });
    })
    .then(() => {
      mainWindow.webContents.focus();
    });
}

ipc.on('q1InputUpdate', function (e, args) {
  const isSendEachChar = [
    'pe',
    'ch',
    'pi',
    'po',
    'cl',
    'hu',
    'bi',
    'interpreter',
  ].includes(args.event.tabAlias);
  q1InputUpdateJS(e, args, isSendEachChar);
});
ipc.on('q1Submit', function (e, args) {
  const { files, value } = args.event;
  if (args.id === 'interpreter') {
    mainWindow.webContents.focus();
    inputToActivePtyProcess(value);
    return;
  }
  const isSendEachChar = ['pe', 'ch', 'pi', 'po', 'cl', 'hu'].includes(args.id);
  const isTriggerSendChar = ['go'].includes(args.id);
  q1InputUpdateJS(e, args, isSendEachChar)
    .then((inputInfo) => {
      if (!Array.isArray(inputInfo) || inputInfo.length !== 2) return;
      const [hasInputElement, siteInputValue] = inputInfo;
      if (!isSendEachChar) return;
      if (!hasInputElement) return;
      const { webContents } = viewMap[args.id];

      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        webContents.sendInputEvent({
          type: 'keyDown',
          keyCode: char,
        });
        webContents.sendInputEvent({
          type: 'char',
          keyCode: char,
        });
        webContents.sendInputEvent({
          type: 'keyUp',
          keyCode: char,
        });
      }
    })
    .then(() => {
      // trigger input for google navigation to work
      if (!isTriggerSendChar) return;
      const { webContents } = viewMap[args.id];
      webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: '',
      });
    })
    .then(() => {
      if (!files || files.length === 0) {
        q1SubmitAndEnter(e, args);
        return;
      }
      const promises = files.map((file) => {
        return fsAsync.readFile(file.path).then((buffer) => {
          const arraybuffer = Uint8Array.from(buffer).buffer;
          return {
            arraybuffer,
            path: file.path,
            name: file.name,
            type: mime.getType(file.path),
          };
        });
      });
      return Promise.all(promises).then((files) => {
        const { webContents } = viewMap[args.id];
        webContents.send('q1View-uploadFile', { files, value });
      });
    });
});
ipc.on('q1EmptyInput', function (e, data) {
  q1InputUpdateJS(
    e,
    {
      id: data.id,
      event: {
        tabAlias: data.id,
        value: data.value,
      },
    },
    false,
    true,
  );
});
ipc.on('q1View-uploadedFile', function (e, args) {
  q1SubmitAndEnter(e, args);
});
ipc.on('q1View-onChangeUploadFile', function (e, data) {
  sendIPCToWindow(mainWindow, 'q1App-onChangeUploadFile', data);
});
ipc.on('q1View-onChangeIsUploading', function (e, data) {
  sendIPCToWindow(mainWindow, 'q1App-onChangeIsUploading', data);
});
ipc.on('q1App-deleteUploadFile', function (e, data) {
  const { webContents } = viewMap[data.id];
  webContents.send('q1View-deleteUploadFile', data);
});

ipc.on('q1LayoutResize', function (e, args) {
  q1LayoutSize = args.layoutSize;
  for (const id in viewMap) {
    setBounds(id, args.bounds);
  }
  // q1OverlayView.setBounds(getWebviewBounds());
});

ipc.on('q1ToggleMenuBar', function (e, args) {
  q1ShouldShowMenuBar = args.shouldShowMenuBar;
  sendIPCToWindow(mainWindow, 'q1-toggleMenuBar', {
    showMenuBar: q1ShouldShowMenuBar,
  });
  for (const id in viewMap) {
    setBounds(id, args.bounds);
  }
});

ipc.on('destroyView', function (e, id) {
  destroyView(id);
});

ipc.on('destroyAllViews', function () {
  destroyAllViews();
});

let setBoundsTimeoutId;
ipc.on('setView', function (e, args) {
  setBounds(args.id, args.bounds);
  setView(args.id);
  setBoundsTimeoutId && clearTimeout(setBoundsTimeoutId);
  setBoundsTimeoutId = setTimeout(() => {
    setBounds(args.id, args.bounds);
    if (args.focus) {
      focusView(args.id);
    }
  }, 50);
});

ipc.on('setBounds', function (e, args) {
  setBounds(args.id, args.bounds, args.isFullscreen);
});

ipc.on('focusView', function (e, id) {
  focusView(id);
});

ipc.on('hideCurrentView', function (e) {
  hideCurrentView();
});

ipc.on('loadURLInView', function (e, args) {
  // wait until the first URL is loaded to set the background color so that new tabs can use a custom background
  if (!viewStateMap[args.id].loadedInitialURL) {
    // viewMap[args.id].setBackgroundColor('#fff');
    // If the view has no URL, it won't be attached yet
    if (args.id === selectedView) {
      mainWindow.addBrowserView(viewMap[args.id]);
    }
  }

  let userAgentId;
  const platform = SYSTEM_CONFIG.platforms.find((p) => p.alias === args.id);
  if (platform) {
    userAgentId = platform.userAgent;
  } else {
    userAgentId = SYSTEM_CONFIG.defaultCustomUrlTab.userAgent;
  }
  const userAgent = SYSTEM_CONFIG.userAgentMeta[userAgentId];
  let options;
  if (args.id === 'go') {
    options = {
      userAgent: mainWindow.isMaximized()
        ? ''
        : SYSTEM_CONFIG.userAgentMeta.mobile_pixel,
    };
  } else if (userAgent) {
    options = { userAgent };
  }

  viewMap[args.id].webContents.loadURL(args.url, options);
  viewStateMap[args.id].loadedInitialURL = true;
});

ipc.on('sendKeyboardEvent', function (e, args) {
  if (!args.modifierKey) {
    viewMap[args.id].webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: args.keyCode,
    });
    return;
  }

  const keyMap = {
    alt: 'Alt',
  };
  viewMap[args.id].webContents.sendInputEvent({
    type: 'keyDown',
    keyCode: keyMap[args.modifierKey],
  });
  viewMap[args.id].webContents.sendInputEvent({
    type: 'keyDown',
    keyCode: args.keyCode,
    modifiers: [args.modifierKey],
  });
  viewMap[args.id].webContents.sendInputEvent({
    type: 'keyUp',
    keyCode: args.keyCode,
    modifiers: [args.modifierKey],
  });
  viewMap[args.id].webContents.sendInputEvent({
    type: 'keyUp',
    keyCode: keyMap[args.modifierKey],
  });
});

ipc.on('callViewMethod', function (e, data) {
  var error, result;
  try {
    var webContents = viewMap[data.id].webContents;
    var methodOrProp = webContents[data.method];
    if (methodOrProp instanceof Function) {
      // call function
      result = methodOrProp.apply(webContents, data.args);
    } else {
      // set property
      if (data.args && data.args.length > 0) {
        webContents[data.method] = data.args[0];
      }
      // read property
      result = methodOrProp;
    }
  } catch (e) {
    error = e;
  }
  if (result instanceof Promise) {
    result.then(function (result) {
      if (data.callId) {
        mainWindow.webContents.send('async-call-result', {
          callId: data.callId,
          error: null,
          result,
        });
      }
    });
    result.catch(function (error) {
      if (data.callId) {
        mainWindow.webContents.send('async-call-result', {
          callId: data.callId,
          error,
          result: null,
        });
      }
    });
  } else if (data.callId) {
    mainWindow.webContents.send('async-call-result', {
      callId: data.callId,
      error,
      result,
    });
  }
});

var lastCapturePlatform;
ipc.on('q1-getCapture', function (e, data) {
  var view = viewMap[data.id];
  if (!view) return;
  if (data.id === lastCapturePlatform) {
    mainWindow.webContents.send('q1-captureData', {
      id: data.id,
      nextId: data.nextId,
      url: null,
    });
    return;
  }
  lastCapturePlatform = data.id;
  view.webContents.capturePage().then(function (img) {
    var size = img.getSize();
    let url;
    if (size.width === 0 && size.height === 0) {
      url = null;
    } else {
      url = img.toDataURL();
    }
    mainWindow.webContents.send('q1-captureData', {
      id: data.id,
      nextId: data.nextId,
      url,
    });
    if (url) {
      storeLastScreenshot(data.id, url);
    }
  });
});

ipc.on('q1-getHomeCapture', function (e, data) {
  var view = viewMap[data.id];
  if (!view) return;
  view.webContents.capturePage().then(function (img) {
    var size = img.getSize();
    let url;
    if (size.width === 0 && size.height === 0) {
      url = null;
    } else {
      url = img.toDataURL();
    }
    mainWindow.webContents.send('q1-captureHomeData', {
      id: data.id,
      url,
    });
    if (url) {
      storeLastHomeScreenshot(data.id, url);
    }
  });
});

ipc.on('getCapture', function (e, data) {
  var view = viewMap[data.id];
  if (!view) {
    // view could have been destroyed
    return;
  }

  const browserViews = mainWindow.getBrowserViews();
  if (!browserViews.includes(view)) {
    mainWindow.webContents.send('captureData', {
      id: data.id,
      url: null,
    });
    return;
  }
  view.webContents.capturePage().then(function (img) {
    var size = img.getSize();
    mainWindow.webContents.send('captureData', {
      id: data.id,
      url: size.width === 0 && size.height === 0 ? null : img.toDataURL(),
    });
  });
});

ipc.on('q1App-getMainCapture', function (e, rect) {
  if (!mainWindow) return;
  mainWindow.webContents.capturePage(rect).then(function (img) {
    var size = img.getSize();
    let url;
    if (size.width === 0 && size.height === 0) {
      url = null;
    } else {
      url = img.toDataURL();
    }
    mainWindow.webContents.send('q1App-resultMainCapture', {
      url,
    });
  });
});

function captureSelectedView() {
  if (!selectedView || !viewMap[selectedView]) return Promise.resolve();
  const view = viewMap[selectedView];
  const browserViews = mainWindow.getBrowserViews();
  if (!browserViews.includes(view)) return Promise.resolve();

  return view.webContents.capturePage().then(function (img) {
    const { width, height } = img.getSize();
    if (width === 0 || height === 0) return null;
    return [selectedView, img.toDataURL()];
  });
}

ipc.on('saveViewCapture', function (e, data) {
  var view = viewMap[data.id];
  if (!view) {
    // view could have been destroyed
  }

  view.webContents.capturePage().then(function (image) {
    view.webContents.downloadURL(image.toDataURL());
  });
});

let removeAutosuggestViewTimeoutId = null;
let shouldShowPlatformAutoSuggest = false;
let shouldShowTextAutoSuggest = false;
let shouldShowOperationAutoSuggest = false;
ipc.on('q1App-setSuggestions', function (e, data) {
  if (!q1AutosuggestView) return;

  if (data.from === 'platform') {
    shouldShowPlatformAutoSuggest = data.shouldShow;
  } else if (data.from === 'text') {
    shouldShowTextAutoSuggest = data.shouldShow;
  } else if (data.from === 'operation') {
    shouldShowOperationAutoSuggest = data.shouldShow;
  }

  if (data.shouldShow) {
    // console.log('show', new Date().getTime());
    removeAutosuggestViewTimeoutId &&
      clearTimeout(removeAutosuggestViewTimeoutId);
    removeAutosuggestViewTimeoutId = null;
    q1AutosuggestView.webContents.send('q1View-setSuggestions', data);
    mainWindow.addBrowserView(q1AutosuggestView);
    q1AutosuggestView.setBounds(getWebviewBounds());
  } else if (
    !shouldShowPlatformAutoSuggest &&
    !shouldShowTextAutoSuggest &&
    !shouldShowOperationAutoSuggest
  ) {
    removeAutosuggestViewTimeoutId &&
      clearTimeout(removeAutosuggestViewTimeoutId);
    removeAutosuggestViewTimeoutId = setTimeout(() => {
      // console.log('hide', data.from, new Date().getTime());
      q1AutosuggestView.webContents.send('q1View-setSuggestions', data);
      mainWindow.removeBrowserView(q1AutosuggestView);
    }, 50);
  }
  // console.log('data.from', data.from);
  // console.log('data.suggestions', data.suggestions.length);
  // console.log('data.shouldShow', data.shouldShow);
  // console.log('data.appContainerHeight', data.appContainerHeight);
  // console.log('data.focusedIndex', data.focusedIndex);
  // console.log('-----------------------');
});
ipc.on('q1View-suggestionClick', function (e, data) {
  mainWindow.webContents.focus();
  mainWindow.webContents.send('q1App-suggestionClick', data);
});
ipc.on('q1View-overlayClick', function (e, data) {
  mainWindow.webContents.send('q1App-hideAutoSuggest', data);
});
ipc.on('q1View-setFocusedIndex', function (e, data) {
  mainWindow.webContents.send('q1App-setFocusedIndex', data);
});
ipc.on('q1View-changeOpacity', function (e, data) {
  // mainWindow.webContents.send('q1App-changeOpacity', data);
  // if (data.webview === 1) {
  //   mainWindow.removeBrowserView(q1OverlayView);
  // } else {
  //   mainWindow.addBrowserView(q1OverlayView);
  //   q1OverlayView.setBounds(getWebviewBounds());
  //   mainWindow.setTopBrowserView(q1HelpView);
  //   q1OverlayView.webContents.send('q1Overlay-changeOpacity', data);
  // }
});
ipc.on('q1View-immediateHideHelp', function () {
  if (!userData.isCompletedHelpTutorial) {
    userData.isCompletedHelpTutorial = true;
    checkNoticePopup();
    writeUserDataFile();
  }
  destroyCustomView(q1HelpView);
});
ipc.on('q1App-toggleHelp', function (e, data) {
  const browserViews = mainWindow.getBrowserViews();
  if (browserViews.includes(q1HelpView)) {
    q1HelpView.webContents.send('q1View-triggerHideHelpPage');

    if (!userData.isCompletedHelpTutorial) {
      userData.isCompletedHelpTutorial = true;
      checkNoticePopup();
      writeUserDataFile();
    }
  } else {
    destroyCustomView(q1PopupView);
    createQ1Help();
  }
});
ipc.on('q1View-showPopup', function (e, data) {
  createQ1Popup();

  sendIPCToWindow(mainWindow, 'q1App-showNavbarButtons');
});
ipc.on('q1View-immediateHidePopup', function (e, data) {
  destroyCustomView(q1PopupView);

  sendIPCToWindow(mainWindow, 'q1App-hideNavbarButtons');
});
ipc.on('q1View-requestOverlay', function (e, data) {
  sendIPCToWindow(mainWindow, 'q1App-receiveRequestOverlay', data);
});
ipc.on('q1View-hideOverlay', function (e, data) {
  sendIPCToWindow(mainWindow, 'q1App-receiveHideOverlay', data);
});
function resizeToWebviewBounds(view, layoutSize) {
  const bounds = view.getBounds();
  const mainBounds = mainWindow.getBounds();
  if (bounds.height === 0) return;
  view.setBounds({
    ...bounds,
    height:
      mainBounds.height -
      2 * getAppMargin() -
      layoutSize.topMenuBarHeight -
      layoutSize.height,
  });
}
ipc.on('q1App-resizeAutosuggestView', function (e, layoutSize) {
  q1AutosuggestView && resizeToWebviewBounds(q1AutosuggestView, layoutSize);
});
ipc.on('q1View-updateHelpBounds', function (e, data) {
  const bounds = q1HelpView.getBounds();
  const staticWebviewBounds = getStaticWebviewBounds();

  const height = Math.round(data.height) + 2 * DEFAULT_APP_MARGIN;
  const { x, y } = getCenterPosition(staticWebviewBounds, bounds.width, height);
  q1HelpView.setBounds({ x, y, width: bounds.width, height });
});
ipc.on('q1-webviewFocus', function (event, data) {
  if (
    mainWindow.isMinimized() ||
    !mainWindow.isVisible() ||
    !mainWindow.isFocused()
  )
    return;
  if (!viewMap[data.id]) return;
  const { webContents } = viewMap[data.id];
  webContents.focus();
});
ipc.on('q1View-resetZoom', function (event, data) {
  const { webContents } = viewMap[data.id];
  webContents.setZoomFactor(getWebviewZoomLevel(data.id));
});
// operation
ipc.on('q1View-onChangeActiveOperations', function (e, data) {
  sendIPCToWindow(mainWindow, 'q1App-onChangeActiveOperations', data);
});
ipc.on('q1App-addOperationTab', function (e, data) {
  if (!viewMap.local) return;
  viewMap.local.webContents.send('q1View-addOperationTab', data);
});
ipc.on('q1App-removeOperationTab', function (e, data) {
  if (!viewMap.local) return;
  viewMap.local.webContents.send('q1View-removeOperationTab', data);
});
ipc.on('q1App-switchOperationTab', function (e, data) {
  if (!viewMap.local) return;
  viewMap.local.webContents.send('q1View-switchOperationTab', data);
});
// interpreter terminal
// let activePtyProcessId;
// const ptyProcessMap = {};
// function getNewLineChar() {
//   return process.platform === 'win32' ? '\r' : '\n';
// }
// function inputToActivePtyProcess(text) {
//   const ptyProcess = ptyProcessMap[activePtyProcessId];
//   if (!ptyProcess) return;
//   ptyProcess.write(text + getNewLineChar());
// }
// function killAllPtyProcess() {
//   Object.keys(ptyProcessMap).forEach((id) => {
//     const ptyProcess = ptyProcessMap[id];
//     ptyProcess && ptyProcess.kill();
//     console.log('-kill ptyProcess', id);
//   });
// }
// ipc.on('q1App-terminalCreate', function (e, { id }) {
//   console.log('spawn ptyProcess', id);
//   const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
//   const ptyProcess = pty.spawn(shell, [], {
//     name: `Interpreter ${id}`,
//     cols: 80,
//     rows: 30,
//     cwd: process.env.HOME,
//     env: process.env,
//   });
//   ptyProcess.on('data', (data) => {
//     const interpreterView = viewMap['interpreter'];
//     if (!interpreterView) return;
//     interpreterView.webContents.send('q1App-receiveTerminalData', {
//       id,
//       data,
//     });
//   });
//   ptyProcess.write('interpreter' + getNewLineChar());
//   ptyProcessMap[id] = ptyProcess;
// });
// ipc.on('q1App-terminalRemove', function (e, { id }) {
//   console.log('kill ptyProcess', id);
//   const ptyProcess = ptyProcessMap[id];
//   ptyProcess && ptyProcess.kill();
//   delete ptyProcessMap[id];
// });
// ipc.on('q1App-terminalChangeTab', function (e, { id }) {
//   activePtyProcessId = id;
// });

let getBackgroundAppProcess;
let activeInterpreterProcessId;
const interpreterProcessMap = {};
function inputToActivePtyProcess(text) {
  const interpreterProcess = interpreterProcessMap[activeInterpreterProcessId];
  if (!interpreterProcess) return;
  interpreterProcess.stdin.write(text + '\n');
}
function killAllInterpreterProcess() {
  Object.keys(interpreterProcessMap).forEach((id) => {
    const interpreterProcess = interpreterProcessMap[id];
    interpreterProcess && interpreterProcess.kill();
    console.log('-kill interpreterProcess', id);
  });
}
ipc.on('q1App-terminalCreate', function (e, { id }) {
  console.log('spawn interpreterProcess', id);

  const pythonCmd = `python${process.platform === 'win32' ? '' : '3'}`;
  const env = userData.openAIAPIKey
    ? { ...process.env, OPENAI_API_KEY: userData.openAIAPIKey }
    : process.env;

  const openInterpreterPath = path.join(
    __dirname,
    `${app.isPackaged ? '../' : ''}extraResources/open-interpreter/interpreter`,
  );
  const interpreterProcess = spawn(pythonCmd, ['main.py'], {
    cwd: openInterpreterPath,
    env,
  });
  interpreterProcess.stdout.on('data', function (data) {
    const interpreterView = viewMap['interpreter'];
    if (!interpreterView) return;
    interpreterView.webContents.send('q1App-receiveTerminalData', {
      id,
      data: data.toString(),
    });
  });
  interpreterProcess.stderr.on('data', function (data) {
    console.log('interpreter error', data.toString());
  });
  interpreterProcess.on('exit', function () {
    console.log('exit interpreter process', id);
    delete interpreterProcessMap[id];
  });
  interpreterProcessMap[id] = interpreterProcess;
});
ipc.on('q1App-terminalRemove', function (e, { id }) {
  console.log('kill interpreterProcess', id);
  const interpreterProcess = interpreterProcessMap[id];
  interpreterProcess && interpreterProcess.kill();
  delete interpreterProcessMap[id];
});
ipc.on('q1App-terminalChangeTab', function (e, { id }) {
  activeInterpreterProcessId = id;
});
ipc.on('q1View-getActionList', function () {
  if (!q1ActionsBarView) return;
  q1ActionsBarView.webContents.send(
    'q1View-receiveActionList',
    SYSTEM_CONFIG.selectionActions,
  );
});
function isIntersection(bounds, webviewBounds) {
  const webViewMinY = webviewBounds.y;
  const webViewMaxY = webviewBounds.y + webviewBounds.height;
  const viewMinY = bounds.y + DEFAULT_APP_MARGIN;
  const viewMaxY =
    bounds.y + DEFAULT_APP_MARGIN + (bounds.height - DEFAULT_APP_MARGIN * 2);

  return viewMaxY > webViewMaxY || viewMinY < webViewMinY;
}
function shouldShowActionsBar(id, cursor) {
  if (id !== selectedView || !viewMap[selectedView]) return [false, null];
  if (!cursor || (cursor.x === 0 && cursor.y === 0)) {
    return [false, null];
  }
  const viewZoomLevel = viewMap[selectedView].webContents.zoomFactor;
  const webviewBounds = getWebviewBounds();
  let width, height;
  if (q1ActionsBarView) {
    width = q1ActionsBarView.getBounds().width;
    height = q1ActionsBarView.getBounds().height;
  } else {
    width = 0;
    height = 38 + ACTION_BAR_MARGIN * 2;
  }
  const x =
    webviewBounds.x - ACTION_BAR_MARGIN + Math.round(cursor.x * viewZoomLevel);
  const y =
    webviewBounds.y - ACTION_BAR_MARGIN + Math.round(cursor.y * viewZoomLevel);
  const nextBounds = { x, y, width, height };
  return [!isIntersection(nextBounds, webviewBounds), nextBounds];
}
let actionsBarVisible = true;
let actionsBarDestroyTimeoutId;
ipc.on('q1View-selectionChange', function (e, data) {
  if (!SYSTEM_CONFIG.actionBarEnabled) return;
  const { id, cursor, text, triggerShow, triggerHide } = data;

  if (triggerHide) {
    clearTimeout(actionsBarDestroyTimeoutId);
    actionsBarDestroyTimeoutId = setTimeout(() => {
      destroyCustomView(q1ActionsBarView);
      console.log('destroy actionsBar');
    }, 5000);
    actionsBarVisible = false;
  }
  if (triggerShow) {
    clearTimeout(actionsBarDestroyTimeoutId);
    actionsBarVisible = true;
  }

  viewSelectionTextMap[id] = text;
  const [show, bounds] = shouldShowActionsBar(id, cursor);
  if (!show) {
    q1ActionsBarView && mainWindow.removeBrowserView(q1ActionsBarView);
    return;
  }
  if (!q1ActionsBarView) {
    createQ1ActionsBar(bounds);
  }
  if (actionsBarVisible) {
    mainWindow.addBrowserView(q1ActionsBarView);
  }
  q1ActionsBarBoundsUpdate(bounds);
});
ipc.on('q1View-updateActionsBarBounds', function (e, data) {
  const bounds = q1ActionsBarView.getBounds();
  const width = Math.round(data.width) + 2 * ACTION_BAR_MARGIN;
  const height = Math.round(data.height) + 2 * ACTION_BAR_MARGIN;
  const { x, y } = bounds;
  q1ActionsBarBoundsUpdate({ x, y, width, height });
});
ipc.on('q1View-actionsBarItemClick', function (e, actionId) {
  const action = SYSTEM_CONFIG.selectionActions.find((a) => a.id === actionId);
  if (!action) return;
  if (action.id === 'action1') {
    const selectedText = viewSelectionTextMap[selectedView];
    if (selectedText) {
      if (process.platform === 'win32') {
        handlePasteTextWindows(selectedText);
      } else if (process.platform === 'darwin') {
        handlePasteTextMac(selectedText);
      }
    }
    return;
  }
  mainWindow.webContents.focus();
  sendIPCToWindow(mainWindow, 'q1App-insertText', { text: action.text });
});
ipc.on('q1App-initGetBackgroundApp', function (e) {
  console.log('spawn getBackgroundAppProcess');
  const pythonCmd = `python${process.platform === 'win32' ? '' : '3'}`;

  const getBackgroundAppPath = path.join(
    __dirname,
    `${app.isPackaged ? '../' : ''}extraResources/get-background-app`,
  );
  getBackgroundAppProcess = spawn(pythonCmd, ['main.py', '3'], {
    cwd: getBackgroundAppPath,
  });
  getBackgroundAppProcess.stdout.on('data', function (data) {
    if (!mainWindow) return;
    mainWindow.webContents.send('q1App-receiveBackgroundApp', {
      appName: data.toString(),
    });
  });
  getBackgroundAppProcess.stderr.on('data', function (data) {
    console.log('getBackgroundApp error', data.toString());
  });
  getBackgroundAppProcess.on('exit', function () {
    console.log('exit getBackgroundApp process');
  });
});

global.getView = getView;
