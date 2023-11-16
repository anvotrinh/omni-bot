export const getCurrentTabUrl = () => {
  if (!window.tabs) return '';
  return window.tabs.get(window.tabs.getSelected()).url;
};

export const getTabUrl = (tabId) => {
  if (!window.tabs) return '';
  return window.tabs.get(tabId).url;
};

export const getCurrentTabId = () => {
  if (!window.tabs) return '';
  return window.tabs.getSelected();
};

export const isTabSleeping = (alias) => {
  const q1TabInfos = window.getQ1TabInfos();
  const tabInfo = q1TabInfos.find((t) => t.alias === alias);
  if (!tabInfo) return true;
  return !tabInfo.isMainLoaded;
};

export const getCurrentWebviewId = () => {
  if (!window.webviews) return null;
  return window.webviews.selectedId;
};
