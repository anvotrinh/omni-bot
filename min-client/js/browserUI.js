const path = require('path');
const logger = require('electron-log');
Object.assign(console, logger.functions);

var statistics = require('js/statistics.js');
var searchEngine = require('js/util/searchEngine.js');
var urlParser = require('js/util/urlParser.js');

/* common actions that affect different parts of the UI (webviews, tabstrip, etc) */

var settings = require('util/settings/settings.js');
var webviews = require('webviews.js');
var focusMode = require('focusMode.js');
var tabBar = require('navbar/tabBar.js');
var tabEditor = require('navbar/tabEditor.js');
var navigationButtons = require('navbar/navigationButtons.js');
var searchbar = require('searchbar/searchbar.js');

let q1TabInfos = [];
let platformInfos = [];

window.getQ1TabInfos = () => {
  return q1TabInfos;
};

const USE_SESSION_ID = true;

const staticPlaceholderMap = {
  g: 'Google.html',
  gi: 'Google.html',
  tr: 'translate.google.com/index.html',
  gp: 'ChatGPT.html',
  po: 'Sage - Poe.html',
  ba: 'Bard.html',
  cal: 'Calculator.net_ Free Online Calculators - Math, Fitness, Finance, Science.html',
  yt: 'YouTube.html',
  gm: 'Gmail.html',
  mp: 'Google Maps.html',
  bi: 'index.html',
  heypi: 'index.html',
  huggingface: 'HuggingChat.html',
  perplexity: 'Perplexity AI.html',
  character: 'index.html',
};
function getStaticPlaceholderUrl(tabInfo) {
  return (
    'file://' +
    path.join(
      __dirname,
      `data/static/${tabInfo.alias}/${staticPlaceholderMap[tabInfo.alias]}`,
    )
  );
}

function getTabIdByAlias(alias) {
  const tabInfo = q1TabInfos.find((t) => t.alias === alias);
  if (tabInfo) return tabInfo.tabId;
  return '';
}
function getTabAliasById(tabId) {
  const tabInfo = q1TabInfos.find((t) => t.tabId === tabId);
  if (tabInfo) return tabInfo.alias;
  return '';
}
function getTabInfoById(tabId) {
  return q1TabInfos.find((tabInfo) => {
    return tabInfo.tabId === tabId;
  });
}
function getTabInfoByAlias(tabAlias) {
  return q1TabInfos.find((tabInfo) => {
    return tabInfo.alias === tabAlias;
  });
}

/* creates a new task */

function addTask() {
  tasks.setSelected(tasks.add());

  tabBar.updateAll();
  addTab();
}

/* creates a new tab */

/*
options
  options.enterEditMode - whether to enter editing mode when the tab is created. Defaults to true.
  options.openInBackground - whether to open the tab without switching to it. Defaults to false.
*/
function addTab(tabId = tabs.add(), options = {}) {
  /*
  adding a new tab should destroy the current one if either:
  * The current tab is an empty, non-private tab, and the new tab is private
  * The current tab is empty, and the new tab has a URL
  */

  if (
    !options.openInBackground &&
    !tabs.get(tabs.getSelected()).url &&
    ((!tabs.get(tabs.getSelected()).private && tabs.get(tabId).private) ||
      tabs.get(tabId).url)
  ) {
    destroyTab(tabs.getSelected());
  }

  tabBar.addTab(tabId);
  webviews.add(tabId);

  if (options.alias) {
    const tabInfo = getTabInfoByAlias(options.alias);
    if (tabInfo) {
      tabInfo.tabId = tabId;
      tabInfo.lastOpenedTime = new Date().getTime();
    } else {
      q1TabInfos.push({
        url: options.url || tabs.get(tabId).url,
        alias: options.alias,
        tabId: tabId,
        lastOpenedTime: new Date().getTime(),
        isMainLoaded: false,
        isUrlLoaded: false,
      });
    }
  }

  if (!options.openInBackground) {
    switchToTab(tabId);
    if (options.enterEditMode !== false) {
      tabEditor.show(tabId);
    }
  } else {
    tabBar.getTab(tabId).scrollIntoView();
  }
}

function moveTabLeft(tabId = tabs.getSelected()) {
  tabs.moveBy(tabId, -1);
  tabBar.updateAll();
}

function moveTabRight(tabId = tabs.getSelected()) {
  tabs.moveBy(tabId, 1);
  tabBar.updateAll();
}

/* destroys a task object and the associated webviews */

function destroyTask(id) {
  var task = tasks.get(id);

  task.tabs.forEach(function (tab) {
    webviews.destroy(tab.id);
  });

  tasks.destroy(id);
}

/* destroys the webview and tab element for a tab */
function destroyTab(id) {
  tabBar.removeTab(id);
  tabs.destroy(id); // remove from state - returns the index of the destroyed tab
  webviews.destroy(id); // remove the webview
}

/* destroys a task, and either switches to the next most-recent task or creates a new one */

function closeTask(taskId) {
  var previousCurrentTask = tasks.getSelected().id;

  destroyTask(taskId);

  if (taskId === previousCurrentTask) {
    // the current task was destroyed, find another task to switch to

    if (tasks.getLength() === 0) {
      // there are no tasks left, create a new one
      return addTask();
    } else {
      // switch to the most-recent task

      var recentTaskList = tasks.map(function (task) {
        return { id: task.id, lastActivity: tasks.getLastActivity(task.id) };
      });

      const mostRecent = recentTaskList.reduce((latest, current) =>
        current.lastActivity > latest.lastActivity ? current : latest,
      );

      return switchToTask(mostRecent.id);
    }
  }
}

/* destroys a tab, and either switches to the next tab or creates a new one */

function closeTab(tabId) {
  /* disabled in focus mode */
  if (focusMode.enabled()) {
    focusMode.warn();
    return;
  }

  if (tabId === tabs.getSelected()) {
    var currentIndex = tabs.getIndex(tabs.getSelected());
    var nextTab =
      tabs.getAtIndex(currentIndex - 1) || tabs.getAtIndex(currentIndex + 1);

    destroyTab(tabId);

    if (nextTab) {
      switchToTab(nextTab.id);
    } else {
      addTab();
    }
  } else {
    destroyTab(tabId);
  }
}

/* changes the currently-selected task and updates the UI */

function switchToTask(id) {
  tasks.setSelected(id);

  tabBar.updateAll();

  var taskData = tasks.get(id);

  if (taskData.tabs.count() > 0) {
    var selectedTab = taskData.tabs.getSelected();

    // if the task has no tab that is selected, switch to the most recent one

    if (!selectedTab) {
      selectedTab = taskData.tabs.get().sort(function (a, b) {
        return b.lastActivity - a.lastActivity;
      })[0].id;
    }

    switchToTab(selectedTab);
  } else {
    addTab();
  }
}

/* switches to a tab - update the webview, state, tabstrip, etc. */

function switchToTab(id, options) {
  options = options || {};

  tabEditor.hide();

  tabs.setSelected(id);
  tabBar.setActiveTab(id);
  webviews.setSelected(id, {
    focus: false,
  });
  if (!tabs.get(id).url) {
    document.body.classList.add('is-ntp');
  } else {
    document.body.classList.remove('is-ntp');
  }
}

tasks.on('tab-updated', function (id, key) {
  if (key === 'url' && id === tabs.getSelected()) {
    document.body.classList.remove('is-ntp');
  }
});

webviews.bindEvent('did-create-popup', function (tabId, popupId, initialURL) {
  var popupTab = tabs.add({
    // in most cases, initialURL will be overwritten once the popup loads, but if the URL is a downloaded file, it will remain the same
    url: initialURL,
    private: tabs.get(tabId).private,
  });

  const tabInfo = getTabInfoById(tabId);
  if (tabInfo) {
    tabInfo.popupTabId = popupTab;
  }
  tabBar.addTab(popupTab);
  webviews.add(popupTab, popupId);
  switchToTab(popupTab);
});

webviews.bindEvent('did-close-popup', function (tabId) {
  const tabInfo = getTabInfoById(tabId);
  if (tabInfo) {
    tabInfo.popupTabId = null;
  }
});

webviews.bindEvent('new-tab', function (tabId, url, openInForeground) {
  webviews.update(tabId, url);
});

webviews.bindIPC('close-window', function (tabId, args) {
  closeTab(tabId);
});

function sendLoadingEvent(tabId, event) {
  const tabInfo = getTabInfoById(tabId);
  if (!tabInfo) return;
  const data = {
    tabAlias: tabInfo.alias,
    event,
    isFromMain: !tabInfo.isMainLoaded, // or from iframe
    isFromChangeUrl: !tabInfo.isUrlLoaded,
  };
  window.onLoadingPageEvent(data);
  window.changeInputPlaceholder(data);
  window.onLoadingBottomEvent(data);
}
webviews.bindIPC('q1-webviewEvent', function (tabId, event) {
  if (event && event.length > 0) {
    sendLoadingEvent(tabId, event[0]);
  }
});
webviews.bindIPC('q1-webviewAutosuggest', function (tabId, data) {
  window.onAutoSuggestion && window.onAutoSuggestion(tabId, data);
});
webviews.bindEvent('did-start-loading', function (tabId) {
  sendLoadingEvent(tabId, 'did-start-loading');
});
webviews.bindEvent('dom-ready', function (tabId) {
  sendLoadingEvent(tabId, 'dom-ready');
});
const getDelayShowTime = (alias) => {
  const platform = platformInfos.find((p) => p.alias === alias);
  return platform ? platform.delayShowTime : 0;
};
const getPlatformHomeUrl = (alias) => {
  const platform = platformInfos.find((p) => p.alias === alias);
  return platform ? platform.url : '';
};
webviews.bindEvent('did-stop-loading', function (tabId) {
  const delayTime = getDelayShowTime(tabId);
  setTimeout(() => {
    sendLoadingEvent(tabId, 'did-stop-loading');
    const tabInfo = getTabInfoById(tabId);
    if (tabInfo) {
      tabInfo.isUrlLoaded = true;
      tabInfo.isMainLoaded = true;
    }
  }, delayTime);
});
webviews.bindEvent(
  'did-start-navigation',
  function (tabId, url, isInPlace, isMainFrame) {
    if (!isMainFrame) return;
    const tabInfo = getTabInfoById(tabId);
    if (tabInfo) {
      tabInfo.isUrlLoaded = false;
    }
    sendLoadingEvent(tabId, 'did-start-navigation');
  },
);

webviews.bindIPC('webview-requestSettings', function (tabId) {
  const data = {
    platformInfos,
    tabId,
  };
  // case: current tabId is a popup
  const tabHasPopupInfo = q1TabInfos.find((t) => t.popupTabId === tabId);
  if (tabHasPopupInfo) {
    data.tabId = tabHasPopupInfo.tabId;
    data.isPopupTab = true;
  }

  webviews.callAsync(tabId, 'send', ['webview-receiveSettings', data]);
});

webviews.bindIPC('webview-destroyPopupTab', function (tabId, args) {
  switchToTab(args[0].hostTabId);
  setTimeout(() => {
    destroyTab(tabId);
  }, 100);
});

webviews.bindIPC('q1-webviewHideApp', function (tabId) {
  ipc.send('q1-hideApp');
});
webviews.bindIPC('q1-webviewFocusBack', function (tabId) {
  ipc.send('q1-appFocusBack');
});

ipc.on('set-file-view', function (e, data) {
  tabs.get().forEach(function (tab) {
    if (tab.url === data.url) {
      tabs.update(tab.id, { isFileView: data.isFileView });
    }
  });
});

ipc.on('apiAutosuggestion', (e, res) => {
  window.onAutoSuggestion && window.onAutoSuggestion(res.tabAlias, res.data);
});
ipc.on('q1App-onChangeUploadFile', (_, data) => {
  window.onChangeUploadFile && window.onChangeUploadFile(data);
  window.onChangeUploadFile_2 && window.onChangeUploadFile_2(data);
});
ipc.on('q1App-onChangeIsUploading', (_, data) => {
  window.onChangeIsUploading && window.onChangeIsUploading(data);
});
ipc.on('q1App-onChangeActiveOperations', (_, data) => {
  window.onChangeActiveOperations && window.onChangeActiveOperations(data);
});
ipc.on('destroyOldestTab', (e) => {
  const filteredTabInfos = q1TabInfos.filter((tabInfo) => {
    return (
      tabInfo.tabId &&
      tabInfo.tabId !== tabs.getSelected() &&
      tabInfo.alias !== 'local' &&
      tabInfo.alias !== 'interpreter' &&
      tabInfo.isMainLoaded &&
      tabInfo.popupTabId !== tabs.getSelected() && // case selected tab is popup tab
      !tabInfo.isBgActiveTab
    );
  });
  if (filteredTabInfos.length <= 1) return;
  let oldestTab = filteredTabInfos[0];

  filteredTabInfos.forEach((tabInfo) => {
    if (tabInfo.lastOpenedTime < oldestTab.lastOpenedTime) {
      oldestTab = tabInfo;
    }
  });

  if (oldestTab.tabId === 'gp') {
    const latestUrl = tabs.get(oldestTab.tabId).url;
    oldestTab.url = latestUrl;
  }
  destroyTab(oldestTab.tabId);
  if (oldestTab.popupTabId) {
    destroyTab(oldestTab.popupTabId);
  }
  oldestTab.tabId = null;
  oldestTab.isMainLoaded = false;
  console.log('destroy', oldestTab.url);
});

ipc.on('q1-showMenuBar', function () {
  // ipc.send('q1ToggleMenuBar', {
  //   bounds: webviews.getViewBounds(),
  //   shouldShowMenuBar: true,
  // });
});

ipc.on('q1-hideMenuBar', function () {
  // ipc.send('q1ToggleMenuBar', {
  //   bounds: webviews.getViewBounds(),
  //   shouldShowMenuBar: false,
  // });
});

ipc.on('q1-appFocus', function () {
  document.body.classList.add('focused');
  webviews.hidePlaceholder('appBlur');
});
let focusTimeoutId;
ipc.on('q1-appBlur', function () {
  focusTimeoutId && clearTimeout(focusTimeoutId);
  focusTimeoutId = setTimeout(() => {
    document.body.classList.remove('focused');
    webviews.requestPlaceholder('appBlur');
  }, 10);
});

ipc.on('loadPlatformsAndUserData', function (event, data) {
  const { platforms, userData } = data;
  platformInfos = platforms;
  q1TabInfos = platformInfos.map((p) => {
    return {
      url: p.url,
      alias: p.alias,
      lastOpenedTime: new Date().getTime(),
      isMainLoaded: false,
      isUrlLoaded: false,
      lastScreenshot: userData.lastScreenshots[p.alias],
      lastHomeScreenshot: userData.lastHomeScreenshots[p.alias],
    };
  });
  // show last home screenshot
  const lastUsedPlatformScreenshot =
    userData.lastHomeScreenshots[userData.lastUsedPlatformAlias] ||
    userData.lastScreenshots[userData.lastUsedPlatformAlias];
  if (!lastUsedPlatformScreenshot) return;

  const placeholderImg = document.getElementById('webview-placeholder');
  placeholderImg.src = lastUsedPlatformScreenshot;
  placeholderImg.hidden = false;
  placeholderImg.onload = () => {
    setTimeout(() => {
      webviews.requestPlaceholder('webview-loading', false);
    }, 10);
  };
});

searchbar.events.on('url-selected', function (data) {
  var searchbarQuery = searchEngine.getSearch(urlParser.parse(data.url));
  if (searchbarQuery) {
    statistics.incrementValue('searchCounts.' + searchbarQuery.engine);
  }

  if (data.background) {
    var newTab = tabs.add({
      url: data.url,
      private: tabs.get(tabs.getSelected()).private,
    });
    addTab(newTab, {
      enterEditMode: false,
      openInBackground: true,
    });
  } else {
    webviews.update(tabs.getSelected(), data.url);
    tabEditor.hide();
  }
});

tabBar.events.on('tab-selected', function (id) {
  switchToTab(id);
});

tabBar.events.on('tab-closed', function (id) {
  closeTab(id);
});

searchbar.events.on('q1-requestPlaceholder', function (reason) {
  webviews.requestPlaceholder(reason);
});

searchbar.events.on('q1-hidePlaceholder', function (reason) {
  webviews.hidePlaceholder(reason);
});

const onCaptureData = (e, data) => {
  const currentTime = new Date().getTime();
  // store it
  const tabInfo = getTabInfoById(data.id);
  // doesn't have tabInfo if case popup
  if (!tabInfo) {
    switchToTab(data.nextId);
    webviews.hidePlaceholder('webview-loading');
    return;
  }
  if (data.url) {
    tabInfo.lastScreenshot = data.url;
    tabInfo.screenshotCapturedAt = currentTime;
  }

  // to avoid racing change tab click
  if (lastChangedTabId && data.nextId !== lastChangedTabId) {
    return;
  }

  const nextTabInfo = getTabInfoById(data.nextId);
  if (nextTabInfo.isMainLoaded) {
    if (nextTabInfo.popupTabId) {
      switchToTab(nextTabInfo.popupTabId);
    } else {
      switchToTab(data.nextId);
    }
    webviews.hidePlaceholder('webview-loading');
    return;
  }
  // load next tab image
  // don't show screenshot if load new url in onetab custom url
  if (data.id !== data.nextId && nextTabInfo.lastScreenshot) {
    const placeholderImg = document.getElementById('webview-placeholder');
    placeholderImg.src = nextTabInfo.lastScreenshot;
    placeholderImg.hidden = false;
    placeholderImg.onload = () => {
      setTimeout(() => {
        webviews.requestPlaceholder('webview-loading', false);
      }, 10);
    };
  } else {
    switchToTab(data.nextId);
    webviews.hidePlaceholder('webview-loading');
  }
};
ipc.on('q1-captureData', (e, data) => {
  onCaptureData(e, data);
});

let lastChangedTabId;
searchbar.events.on('q1-changeTab', function (data) {
  const toTab = q1TabInfos.find((tabInfo) => {
    return tabInfo.alias === data.alias;
  });
  if (!toTab) return;

  toTab.lastOpenedTime = new Date().getTime();

  if (!toTab.alias.startsWith('url')) {
    ipc.send('updateUserData', {
      lastUsedPlatformAlias: toTab.alias,
    });
  }

  if (!toTab.tabId) {
    var newTabId = tabs.add({
      id: toTab.alias,
      url: toTab.url,
    });
    addTab(newTabId, {
      enterEditMode: false,
      openInBackground: true,
    });

    toTab.tabId = newTabId;
    toTab.isMainLoaded = false;

    // const staticUrl = getStaticPlaceholderUrl(toTab);
    // if (staticUrl) {
    //   webviews.update('placeholder', staticUrl);
    //   switchToTab('placeholder');
    // } else {
    //   switchToTab(newTabId);
    // }
  }

  lastChangedTabId = toTab.tabId;
  // store last screenshot
  ipc.send('q1-getCapture', { id: tabs.getSelected(), nextId: toTab.tabId });
});
// take screenshot of homepage
webviews.bindEvent('did-finish-load', function (tabId) {
  const tabInfo = getTabInfoById(tabId);
  if (!tabInfo) return;

  const homePageUrls = [removeSlash(getPlatformHomeUrl(tabId))];
  if (tabId === 'ch') {
    homePageUrls.push('https://beta.character.ai');
  } else if (tabId === 'go') {
    homePageUrls.push('https://www.google.com');
  } else if (tabId === 'bi') {
    homePageUrls.push('https://www.bing.com/search?q=Bing+AI&showconv=1');
  }
  const currentTabUrl = removeSlash(tabs.get(tabId).url);
  if (!homePageUrls.includes(currentTabUrl)) return;

  const delayTime = getDelayShowTime(tabId);
  setTimeout(() => {
    ipc.send('q1-getHomeCapture', { id: tabId });
  }, delayTime + 200);
});
ipc.on('q1-captureHomeData', (e, data) => {
  const tabInfo = getTabInfoById(data.id);
  if (data.url) {
    tabInfo.lastHomeScreenshot = data.url;
  }
});
function removeSlash(url) {
  if (url.endsWith('/')) {
    return url.substring(0, url.length - 1);
  }
  return url;
}

// webviews.bindEvent('did-navigate', function (tabId) {
//   const tabInfo = getTabInfoById(tabId);
//   if (tabInfo && tabInfo.isJustReturnHome) {
//     tabInfo.isJustReturnHome = false;
//     webviews.callAsync(tabId, 'clearHistory');
//     navigationButtons.update();
//   }
// });
searchbar.events.on('q1-tabReturnHome', function (data) {
  const tabInfo = getTabInfoByAlias(data.alias);
  if (!tabInfo) return;
  tabInfo.isMainLoaded = false;
  if (tabInfo.tabId) {
    // tabInfo.isJustReturnHome = true;
    webviews.update(tabInfo.tabId, tabInfo.url);
    ipc.send('q1View-resetZoom', { id: tabInfo.tabId });
  }
});

searchbar.events.on('q1-layoutResize', function (layoutSize) {
  webviews.q1LayoutResize(layoutSize);
});

searchbar.events.on('q1-setAlwaysOnTop', function (data) {
  ipc.send('setAlwaysOnTop', data);
});

searchbar.events.on('q1-toggleWindowPosition', function (data) {
  ipc.send('toggleWindowPosition');
});

searchbar.events.on('q1-minimize', function (data) {
  ipc.invoke('minimize');
});

searchbar.events.on('q1-updatePlatformBgList', function (data) {
  q1TabInfos.forEach((tabInfo) => {
    if (!data.bgList.includes(tabInfo.alias)) {
      tabInfo.isBgActiveTab = false;
      return;
    }
    tabInfo.isBgActiveTab = true;
    if (tabInfo.tabId) return;
    const newTabId = tabs.add({
      id: USE_SESSION_ID ? tabInfo.alias : '',
      url: tabInfo.url,
    });
    addTab(newTabId, {
      enterEditMode: false,
      openInBackground: true,
    });

    tabInfo.tabId = newTabId;
    console.log('re-create', tabInfo.url);
  });
});

searchbar.events.on('q1-switchToTabByAlias', function (tabAlias) {
  const toTab = q1TabInfos.find((tabInfo) => {
    return tabInfo.alias === tabAlias;
  });
  if (!toTab) {
    switchToTab(q1TabInfos[0].tabId);
    return;
  }
  switchToTab(tabAlias);
  webviews.hidePlaceholder('webview-loading');
});

searchbar.events.on('q1-newURLTab', function (data) {
  var newTabId = tabs.add({ id: data.alias, url: data.url });
  addTab(newTabId, data);

  switchToTab(newTabId);
});

searchbar.events.on('q1-updateTab', function (data) {
  const tabInfo = getTabInfoByAlias(data.alias);
  if (!tabInfo) return;
  tabInfo.url = data.url;
  tabInfo.isMainLoaded = false;
  if (tabInfo.tabId) {
    webviews.update(tabInfo.tabId, data.url);
  }
});

searchbar.events.on('q1-sendKeyboardEvent', function (data) {
  ipc.send('sendKeyboardEvent', {
    id: tabs.getSelected(),
    keyCode: data.keyCode,
    modifierKey: data.modifierKey,
  });
});

const isURLSameDomain = function (tabInfo, currentURL) {
  try {
    const tabInfoHost = new URL(tabInfo.url).host;
    const currentHost = new URL(currentURL).host;
    if (tabInfoHost === currentHost) return true;
    if (tabInfo.alias === 'gm') {
      return ['mail.google.com'].includes(currentHost);
    }
    if (tabInfo.alias === 'ch') {
      return ['beta.character.ai'].includes(currentHost);
    }
    if (tabInfo.alias === 'go') {
      return ['www.google.com'].includes(currentHost);
    }
    return false;
  } catch {
    return false;
  }
};
const tabLoadingInput = {};
webviews.bindEvent('did-finish-load', function (tabId) {
  const inputData = tabLoadingInput[tabId];
  if (!inputData) return;
  setTimeout(() => {
    webviews.q1InputUpdate(tabId, inputData);
  });
  delete tabLoadingInput[tabId];
});
searchbar.events.on('q1-input', function (data) {
  // TODO write common function
  if (data.value.startsWith('@')) {
    // TODO fix back to main screen of current
    const spacePos = data.value.search(' ');
    if (spacePos === -1) return;
    const aliasList = data.value.slice(1, spacePos).split(',');
    const inputStr = data.value.slice(spacePos + 1);
    aliasList.forEach((alias) => {
      const tabId = getTabIdByAlias(alias);
      if (!tabId) return;
      webviews.q1InputUpdate(tabId, {
        value: inputStr,
        tabAlias: alias,
      });
    });
    return;
  }

  const curTabId = tabs.getSelected();
  const tabInfo = q1TabInfos.find((t) => t.tabId === curTabId);
  const tabCurrentUrl = tabs.get(tabs.getSelected()).url;
  if (!tabInfo) return;
  data.tabAlias = tabInfo.alias;
  // if url tab, don't go back, don't clear history
  if (tabInfo.alias.startsWith('url')) {
    webviews.q1InputUpdate(curTabId, data);
    return;
  }
  // if the user still in the page, don't go back
  if (isURLSameDomain(tabInfo, tabCurrentUrl)) {
    webviews.q1InputUpdate(curTabId, data);
    // clear history, incase the login page is the first page
    if (!tabInfo.isClearedHistory) {
      webviews.callAsync(curTabId, 'clearHistory');
      tabInfo.isClearedHistory = true;
    }
    return;
  }
  // go back to home page
  webviews.callAsync(curTabId, 'canGoBack', function (err, canGoBack) {
    if (err) return;

    const notBackUrls = ['accounts.google.com'];
    let host;
    try {
      host = new URL(tabCurrentUrl).host;
    } catch (e) {}

    if (canGoBack && !notBackUrls.includes(host)) {
      webviews.callAsync(curTabId, 'goToIndex', 0);
      tabLoadingInput[curTabId] = data;
    } else {
      webviews.q1InputUpdate(curTabId, data);
    }
  });
});

searchbar.events.on('q1-submit', function (data) {
  if (data.value.startsWith('@')) {
    const spacePos = data.value.search(' ');
    if (spacePos === -1) return;
    const aliasList = data.value.slice(1, spacePos).split(',');
    const inputStr = data.value.slice(spacePos + 1);
    aliasList.forEach((alias) => {
      const tabInfo = q1TabInfos.find((t) => t.alias === alias);
      if (tabInfo && tabInfo.tabId) {
        console.log('submit', tabInfo.alias, inputStr);
        webviews.q1Submit(tabInfo.tabId, { ...data, value: inputStr });
      }
    });
    return;
  }
  console.log('submit', data);
  webviews.focus();
  webviews.q1Submit(tabs.getSelected(), data);
});

module.exports = {
  addTask,
  addTab,
  destroyTask,
  destroyTab,
  closeTask,
  closeTab,
  switchToTask,
  switchToTab,
  moveTabLeft,
  moveTabRight,
  USE_SESSION_ID,
};
