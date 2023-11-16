const urlRegex =
  /^(https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export function isValidUrl(str) {
  return urlRegex.test(str);
}

export function getUrlFavicon(str) {
  let url = str;
  if (!str.startsWith('https://') && !str.startsWith('http://')) {
    url = `https://${str}`;
  }
  try {
    const host = new URL(url).host;
    return `https://${host}/favicon.ico`;
  } catch {
    return '';
  }
}

export function getUrlChar(str) {
  let url = str;
  if (!str.startsWith('https://') && !str.startsWith('http://')) {
    url = `https://${str}`;
  }
  try {
    const host = new URL(url).host;
    if (host.startsWith('www.') && host.length > 4) {
      return host[4];
    }
    return host[0];
  } catch {
    return '';
  }
}

export function isPositiveInterger(str) {
  return /^\d+$/.test(str);
}

// to fix ... suggestion text in google
export function getFullSuggestionText(
  platformAlias,
  itemText,
  inputStringParam,
) {
  if (platformAlias !== 'go') return itemText;
  if (!itemText.startsWith('... ')) return itemText;
  if (inputStringParam.startsWith('... ')) return itemText;
  const inputString = inputStringParam.trim();

  const itemInnerText = itemText.substring(4);
  for (let i = 1; i <= itemInnerText.length; i++) {
    const startItemText = itemInnerText.substring(0, i);
    if (inputString.length - i < 0) break;
    const endInputStr = inputString.substring(inputString.length - i);
    if (startItemText === endInputStr) {
      return inputString.substring(0, inputString.length - i) + itemInnerText;
    }
  }
  return inputString + itemInnerText;
}

export function isInUrlList(urlList, checkedUrl) {
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

export function parseTextSearch(value) {
  const res = {
    platformAliasList: [],
    text: value,
  };
  if (!value.startsWith('@')) return res;
  const spacePos = value.search(' ');
  if (spacePos === -1) return res;
  return {
    platformAliasList: value.slice(1, spacePos).split(','),
    text: value.slice(spacePos + 1),
  };
}
