/* imports common modules */

var electron = require('electron');
var ipc = electron.ipcRenderer;

var propertiesToClone = [
  'deltaX',
  'deltaY',
  'metaKey',
  'ctrlKey',
  'defaultPrevented',
  'clientX',
  'clientY',
];

function cloneEvent(e) {
  var obj = {};

  for (var i = 0; i < propertiesToClone.length; i++) {
    obj[propertiesToClone[i]] = e[propertiesToClone[i]];
  }
  return JSON.stringify(obj);
}

// workaround for Electron bug
setTimeout(function () {
  /* Used for swipe gestures */
  window.addEventListener('wheel', function (e) {
    ipc.send('wheel-event', cloneEvent(e));
  });

  var scrollTimeout = null;

  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function () {
      ipc.send('scroll-position-change', Math.round(window.scrollY));
    }, 200);
  });
}, 0);

/* Used for picture in picture item in context menu */
ipc.on('getContextMenuData', function (event, data) {
  // check for video element to show picture-in-picture menu
  var hasVideo = Array.from(document.elementsFromPoint(data.x, data.y)).some(
    (el) => el.tagName === 'VIDEO',
  );
  ipc.send('contextMenuData', { hasVideo });
});

ipc.on('enterPictureInPicture', function (event, data) {
  var videos = Array.from(document.elementsFromPoint(data.x, data.y)).filter(
    (el) => el.tagName === 'VIDEO',
  );
  if (videos[0]) {
    videos[0].requestPictureInPicture();
  }
});

window.addEventListener('message', function (e) {
  if (!e.origin.startsWith('file://')) {
    return;
  }

  if (e.data && e.data.message && e.data.message === 'showCredentialList') {
    ipc.send('showCredentialList');
  }
});

ipc.send('q1-webviewEvent', 'begin-page-load');

const shouldKeepFocusHosts = ['accounts.google.com'];

const AUTO_CONTENT_SUGGEST_PLATFORMS = ['go', 'gi', 'mp'];
const HAS_UPLOAD_FILE_PLATFORMS = ['cl', 'po', 'ba', 'bi', 'pe'];
const ONLY_CHECK_UPLOADING_PLATFORMS = ['gp'];
let curPlatformAlias;
let isCurPopupTab = false;
let platforms = [];

ipc.send('webview-requestSettings');
ipc.on('webview-receiveSettings', function (event, data) {
  const { tabId, isPopupTab, platformInfos } = data;
  curPlatformAlias = tabId;
  isCurPopupTab = isPopupTab;
  platforms = platformInfos;
  if (AUTO_CONTENT_SUGGEST_PLATFORMS.includes(curPlatformAlias)) {
    window.addEventListener('DOMSubtreeModified', suggestionListener);
  }
  if (HAS_UPLOAD_FILE_PLATFORMS.includes(curPlatformAlias)) {
    setIntervalCheckUploadFile();
    setIntervalCheckIsUploading();
  } else if (ONLY_CHECK_UPLOADING_PLATFORMS.includes(curPlatformAlias)) {
    setIntervalCheckIsUploading();
  } else {
    setIntervalForNoneUploadFilePlatform();
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      ipc.send('q1-webviewHideApp');
    }
  });

  if (shouldKeepFocusHosts.includes(window.location.host)) {
    initIntervalFocusInput();
  }

  if (isURLSamePlatformDomain(window.location.href)) {
    ipc.send('q1-webviewFocusBack');
  }

  window.addEventListener('mouseup', () => handleSelectionChange('mouseup'));
  document.addEventListener('selectionchange', () =>
    handleSelectionChange('change'),
  );
  window.addEventListener(
    'scroll',
    () => handleSelectionChange('scroll'),
    true,
  );
});

function isURLSamePlatformDomain(currentURL) {
  const platformInfo = platforms.find(
    ({ alias }) => alias === curPlatformAlias,
  );
  if (!platformInfo) return false;

  try {
    const tabInfoHost = new URL(platformInfo.url).host;
    const currentHost = new URL(currentURL).host;
    if (tabInfoHost === currentHost) return true;
    if (platformInfo.alias === 'gm') {
      return ['mail.google.com'].includes(currentHost);
    }
    if (platformInfo.alias === 'ch') {
      return ['beta.character.ai'].includes(currentHost);
    }
    if (platformInfo.alias === 'go') {
      return ['www.google.com'].includes(currentHost);
    }
    return false;
  } catch {
    return false;
  }
}

function getInputValue() {
  let inputDOM;
  switch (curPlatformAlias) {
    case 'go':
      inputDOM = document.getElementsByName('q')[0];
      if (!inputDOM) return null;
      return inputDOM.value;
    case 'gi':
      inputDOM = document.getElementsByName('q')[0];
      if (!inputDOM) return null;
      return inputDOM.value;
    case 'mp':
      inputDOM = document.getElementsByTagName('input')[0];
      if (!inputDOM) return null;
      return inputDOM.value;
    default:
      return null;
  }
}
function getFileInputDOM() {
  let inputDOM;
  switch (curPlatformAlias) {
    case 'po':
    case 'pe':
    case 'gp':
      inputDOM = document.querySelector('input[type="file"]');
      return inputDOM;
    case 'cl':
      inputDOM = document.querySelector(
        'fieldset.sm\\:sticky input[type="file"]',
      );
      if (inputDOM) return inputDOM;
      inputDOM = document.querySelector('fieldset.relative input[type="file"]');
      return inputDOM;
    case 'bi':
      const cibSerp = document.querySelector('cib-serp');
      if (!cibSerp) return null;
      const cibAction = cibSerp.shadowRoot.getElementById(
        'cib-action-bar-main',
      );
      if (!cibAction) return null;
      return cibAction.shadowRoot.querySelector('input[type="file"]');
    case 'ba':
      deleteUploadFileItemByIndex(0);
      document.querySelector('uploader button').click();
      return document.querySelector('input');
    default:
      return null;
  }
}
function getSuggestion() {
  let sugg_list = [];
  switch (curPlatformAlias) {
    case 'go':
    case 'gi':
      const suggestions_list = document.querySelector('ul[role="listbox"]');
      if (!suggestions_list) return sugg_list;
      const li_list = suggestions_list.getElementsByTagName('li');
      if (!li_list) return sugg_list;
      for (let li of li_list) {
        const span = li.querySelector('span');
        if (!span) continue;
        const iconDiv = li.querySelector('div[data-src]');
        const iconSrc = iconDiv ? iconDiv.getAttribute('data-src') : '';
        sugg_list.push({
          name: span.innerText,
          decs: '',
          icon: iconSrc,
        });
      }
      if (sugg_list.length === 0) {
        //google images
        const names = document.getElementsByClassName('Hlfhoe');
        for (let i = 0; i < names.length; ++i) {
          sugg_list.push({ name: names[i].innerText, decs: '', icon: '' });
        }
      }
      if (sugg_list.length === 0) {
        //google images2
        const names = document.getElementsByClassName('wM6W7d');
        for (let i = 0; i < names.length; ++i) {
          sugg_list.push({ name: names[i].innerText, decs: '', icon: '' });
        }
      }
      break;
    case 'mp':
      const names = document.getElementsByClassName('YI1aof');
      const descs = document.getElementsByClassName('JzOyoc');
      if (names.length === descs.length) {
        for (var i = 0; i < names.length; ++i) {
          sugg_list.push({
            name: names[i].innerText,
            decs: descs[i].innerText,
            icon: '',
          });
        }
      }
      break;
    case 'yt':
      const a = Array.prototype.slice
        .call(document.getElementsByClassName('sbpqs_a'))
        .flatMap((a) => ({ name: a.innerText, decs: '', icon: '' }));
      const b = Array.prototype.slice
        .call(document.getElementsByClassName('sbqs_c'))
        .flatMap((a) => ({ name: a.innerText, decs: '', icon: '' }));
      sugg_list = a.concat(b);
      break;
    default:
      break;
  }
  if (sugg_list.length === 1 && sugg_list[0].name === '') {
    return [];
  }
  return sugg_list;
}
function getUniqueSuggestion() {
  const search = getInputValue();
  if (search === '') return [];

  const suggestion = getSuggestion();
  // fix for google, to get the correct result
  if (suggestion.some((s) => s.name === '')) return null;
  return suggestion;
}

function suggestionListener() {
  setTimeout(() => {
    const suggestions = getUniqueSuggestion();
    if (!suggestions) return;
    ipc.send('q1-webviewAutosuggest', suggestions);
  });
}

const cacheLoadedImageBase64Map = {};
const isLoadingImageBase64Map = {};
function addBase64Image(item) {
  return new Promise((resolve) => {
    if (cacheLoadedImageBase64Map[item.imgSrc]) {
      resolve(item);
      return;
    }
    isLoadingImageBase64Map[item.imgSrc] = true;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = image.naturalHeight;
      canvas.width = image.naturalWidth;
      ctx.drawImage(image, 0, 0);
      const dataUrl = canvas.toDataURL();

      cacheLoadedImageBase64Map[item.imgSrc] = dataUrl;
      isLoadingImageBase64Map[item.imgSrc] = false;

      item.base64Image = dataUrl;
      resolve(item);
    };
    image.src = item.imgSrc;
  });
}

const isExceptionNode = (node) => {
  if (curPlatformAlias === 'gp') {
    if (
      node.nodeName === 'DIV' &&
      ['absolute', 'right-1', 'z-10', 'visible'].every((c) =>
        node.classList.contains(c),
      )
    ) {
      return true;
    }
    return false;
  }
  // other
  if (node.nodeName === 'A' && node.getAttribute) {
    const href = node.getAttribute('href');
    if (!href) return false;
    return (
      href.startsWith('https://accounts.google.com/SignOutOptions') ||
      href.startsWith('https://accounts.google.com/ServiceLogin')
    );
  }
  if (node.nodeName === 'C-WIZ') {
    return true;
  }
  return false;
};
function backToApp(event) {
  const { target } = event;
  if (!target) return;

  let node = target;
  let isInInput = false;
  while (node) {
    if (!node) break;
    if (isExceptionNode(node)) {
      isInInput = true;
      break;
    }
    if (
      node.nodeName === 'TEXTAREA' ||
      node.nodeName === 'INPUT' ||
      (node.getAttribute && node.getAttribute('contenteditable'))
    ) {
      isInInput = true;
      break;
    }
    node = node.parentNode;
  }
  if (!isInInput) {
    ipc.send('q1-webviewFocusBack');
  }
}

function isInUrlList(urlList, checkedUrl) {
  return urlList.some((item) => {
    if (typeof item === 'string') {
      return checkedUrl.startsWith(item);
    }
    if (item instanceof RegExp) {
      return checkedUrl.match(item);
    }
    return false;
  });
}
const isLoginPage = () => {
  const platformInfo = platforms.find(
    ({ alias }) => alias === curPlatformAlias,
  );
  if (!platformInfo) return false;
  return isInUrlList(platformInfo.loginUrls, window.location.href);
};
// if mouse isn't clicked to a input then focus back to the composebox
window.addEventListener('mouseup', function (event) {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection.isCollapsed && !isLoginPage()) {
      backToApp(event);
    }
  });
});

// case: not platform home page, and inside the page has input
const initIntervalFocusInput = () => {
  // case: the page has dynamic input
  setInterval(() => {
    const inputDOMs = document.querySelectorAll(
      'input:not([type="hidden"]):not([q1-checked])',
    );
    if (inputDOMs.length === 0) return;
    inputDOMs.forEach((inputDOM) => {
      inputDOM.setAttribute('q1-checked', '');
    });
    ipc.send('q1-webviewFocus', { id: curPlatformAlias });
  }, 100);

  setTimeout(() => {
    backToApp({ target: document.activeElement });
  }, 200);
};

ipc.on('q1View-uploadFile', function (event, { files, value }) {
  const fileInputDOM = getFileInputDOM();
  if (!fileInputDOM) return;

  let container = new DataTransfer();
  files.forEach(({ arraybuffer, name, type }) => {
    const item = new File([arraybuffer], name, {
      type,
      lastModified: new Date().getTime(),
    });
    container.items.add(item);
  });

  fileInputDOM.files = container.files;

  fileInputDOM.dispatchEvent(
    new Event('change', { bubbles: true, cancelable: true }),
  );

  if (value) {
    ipc.send('q1View-uploadedFile', { id: curPlatformAlias });
  }
});

// for send back the image by base64, since some url is blocked outside
function getBase64UploadItem(itemDOM, imgSrc) {
  if (!imgSrc || isLoadingImageBase64Map[imgSrc]) {
    return {
      dom: itemDOM,
      imgSrc,
      shouldAddBase64: false,
      isLoading: true,
    };
  }
  return {
    dom: itemDOM,
    imgSrc,
    shouldAddBase64: !cacheLoadedImageBase64Map[imgSrc],
    isLoading: false,
  };
}
function getFileUploadItems() {
  const uploadItems = [];
  switch (curPlatformAlias) {
    case 'cl':
      document
        .querySelectorAll(
          'fieldset div:has(> button[aria-label="Preview contents"])',
        )
        .forEach((itemDOM) => {
          const name = itemDOM.querySelector('p')?.innerText || '';
          const size = itemDOM.querySelector('div[class^=text]')?.innerText;
          const type = itemDOM.querySelector('div.uppercase')?.innerText;
          uploadItems.push({ dom: itemDOM, name, size, type });
        });
      break;
    case 'po':
      document
        .querySelectorAll('footer div[class^=ChatMessageInputAttachments]')
        .forEach((itemDOM) => {
          const name = itemDOM.querySelector(
            'div[class^=FileInfo_title]',
          )?.innerText;
          const metaData = itemDOM.querySelector(
            'div[class^=FileInfo_metadata]',
          )?.innerText;
          const [type, size] = metaData.split(' · ');
          uploadItems.push({ dom: itemDOM, name, size, type });
        });
      break;
    case 'bi':
      const cibSerp = document.querySelector('cib-serp');
      if (!cibSerp) return [];
      const cibAction = cibSerp.shadowRoot.getElementById(
        'cib-action-bar-main',
      );
      if (!cibAction) return [];
      const cibAttachmentList = cibAction.shadowRoot.querySelector(
        'cib-attachment-list',
      );
      if (!cibAttachmentList) return [];
      cibAttachmentList.shadowRoot
        .querySelectorAll('cib-file-item')
        .forEach((itemDOM) => {
          const imgSrc = itemDOM.shadowRoot.querySelector('img')?.src;
          uploadItems.push(getBase64UploadItem(itemDOM, imgSrc));
        });
      break;
    case 'ba':
      document.querySelectorAll('uploader-file-preview').forEach((itemDOM) => {
        const imgSrc = itemDOM.querySelector('img')?.src;
        uploadItems.push(getBase64UploadItem(itemDOM, imgSrc));
      });
      break;
    case 'pe':
      document
        .querySelectorAll('div.flex.leading-none:has(> svg.fa-file)')
        .forEach((itemDOM) => {
          const name = itemDOM.innerText;
          const nameParts = name.split('.');
          const type =
            nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
          uploadItems.push({ dom: itemDOM, name, size: '', type });
        });
      break;
    default:
      break;
  }
  return uploadItems;
}

function getDeleteButtonOfFileUploadItem(itemDOM) {
  switch (curPlatformAlias) {
    case 'cl':
      return itemDOM.querySelector('div.absolute');
    case 'po':
      return itemDOM.querySelector('button');
    case 'bi':
      return itemDOM.shadowRoot.querySelector('button');
    case 'ba':
      return itemDOM.querySelector('button');
    case 'pe':
      itemDOM.click();
      setTimeout(() => {
        const deleteButtonDOM = document.querySelector(
          'div:has(> svg.fa-circle-xmark)',
        );
        deleteButtonDOM && deleteButtonDOM.click();
      });
      return null;
    default:
      return null;
  }
}

let checkUploadFileIntervalId;
function setIntervalCheckUploadFile() {
  checkUploadFileIntervalId && clearInterval(checkUploadFileIntervalId);
  checkUploadFileIntervalId = setInterval(() => {
    changeUploadFileListener();
  }, 100);
}
function setIntervalForNoneUploadFilePlatform() {
  checkUploadFileIntervalId && clearInterval(checkUploadFileIntervalId);
  checkUploadFileIntervalId = setInterval(() => {
    ipc.send('q1View-onChangeUploadFile', {
      id: curPlatformAlias,
      items: [],
    });
    ipc.send('q1View-onChangeIsUploading', {
      id: curPlatformAlias,
      isUploading: false,
    });
  }, 100);
}

function toIPCUploadItems(fileUploadItems) {
  return fileUploadItems.map(({ dom, shouldAddBase64, ...itemData }) => {
    if (!shouldAddBase64) return itemData;
    return {
      ...itemData,
      isLoading: true,
    };
  });
}
function changeUploadFileListener() {
  const fileUploadItems = getFileUploadItems();
  const shouldAddBase64 = fileUploadItems.some(
    ({ shouldAddBase64 }) => shouldAddBase64,
  );
  if (!shouldAddBase64) {
    ipc.send('q1View-onChangeUploadFile', {
      id: curPlatformAlias,
      items: toIPCUploadItems(fileUploadItems),
    });
    return;
  }
  // convert to base64, incase the url is blocked outside
  // send the loading item
  ipc.send('q1View-onChangeUploadFile', {
    id: curPlatformAlias,
    items: toIPCUploadItems(fileUploadItems),
  });
  // send the base64 item
  const promises = fileUploadItems.map((item) => addBase64Image(item));
  Promise.all(promises).then((items) => {
    ipc.send('q1View-onChangeUploadFile', {
      id: curPlatformAlias,
      items: toIPCUploadItems(items),
    });
  });
}

function deleteUploadFileItemByIndex(fileIndex) {
  const itemDOMs = getFileUploadItems().map((item) => item.dom);
  if (fileIndex >= itemDOMs.length) return;
  const itemDOM = itemDOMs[fileIndex];
  const deleteBtnDOM = getDeleteButtonOfFileUploadItem(itemDOM);
  deleteBtnDOM && deleteBtnDOM.click();
}

ipc.on('q1View-deleteUploadFile', function (event, { fileIndex }) {
  deleteUploadFileItemByIndex(fileIndex);
});

// check is uploading
function getIsUploading() {
  let isUploading = false;
  switch (curPlatformAlias) {
    case 'gp':
      isUploading =
        document.querySelectorAll(
          'form:has(div.relative.inline-block.text-xs.text-gray-900) button.absolute.p-1:disabled',
        ).length > 0;
      break;
    case 'pe':
      isUploading =
        document.querySelectorAll(
          'div:has(> textarea) svg.fa-circle-half-stroke',
        ).length > 0;
      break;
    case 'cl':
      isUploading =
        document.querySelectorAll(
          'fieldset label:has(input[type="file"]) svg.animate-spin',
        ).length > 0;
      break;
    default:
      break;
  }
  return isUploading;
}
let checkIsUploadingIntervalId;
function setIntervalCheckIsUploading() {
  clearInterval(checkIsUploadingIntervalId);
  checkIsUploadingIntervalId = setInterval(() => {
    ipc.send('q1View-onChangeIsUploading', {
      id: curPlatformAlias,
      isUploading: getIsUploading(),
    });
  }, 100);
}

function handleSelectionChange(reason) {
  const selection = document.getSelection();
  if (selection.rangeCount === 0 || selection.isCollapsed) {
    ipc.send('q1View-selectionChange', {
      id: curPlatformAlias,
      cursor: null,
      text: '',
      triggerHide: true,
    });
    return;
  }
  const focusRange = new Range();
  focusRange.setStart(selection.focusNode, selection.focusOffset);
  focusRange.setEnd(selection.focusNode, selection.focusOffset);
  let bound = focusRange.getBoundingClientRect();
  if (bound.x === 0 && bound.y === 0) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length > 0) {
      if (
        selection.anchorNode === range.startContainer &&
        selection.anchorOffset === range.startOffset
      ) {
        bound = rects[rects.length - 1];
      } else {
        bound = rects[0];
      }
    }
  }
  ipc.send('q1View-selectionChange', {
    id: curPlatformAlias,
    cursor: { x: bound.x + bound.width, y: bound.y + bound.height },
    text: selection.toString(),
    triggerShow: reason === 'mouseup',
  });
}

ipc.on('q1-screenSizeClass', function (e, { className }) {
  document.body.classList.remove(
    'sh-768',
    'sh-900',
    'sh-992',
    'sh-1080',
    'sh-max',
    'sh-mini',
  );
  document.body.classList.add(className);
});
