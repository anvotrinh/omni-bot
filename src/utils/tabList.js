// TODO rename this file

import {
  ClaudeSvg,
  ChatGptSvg,
  GoogleSvg,
  BingSvg,
  BardSvg,
  CalculatorSvg,
  GTranslateSvg,
  PoeSvg,
  YoutubeSvg,
  GooglePhotoIcon,
  GoogleMapIcon,
  GmailIcon,
  HeyPiIcon,
  PerplexityIcon,
  CharacterIcon,
  HuggingFaceIcon,
  BackIcon,
} from '../SVG';
import { AUTO_CONTENT_SUGGEST_PLATFORMS } from '../config';
import { getUrlFavicon } from './text';

export const platformIconMap = {
  cl: <ClaudeSvg />,
  go: <GoogleSvg />,
  gi: <GooglePhotoIcon />,
  mp: <GoogleMapIcon />,
  gm: <GmailIcon />,
  gp: <ChatGptSvg />,
  ba: <BardSvg />,
  bi: <BingSvg />,
  cal: <CalculatorSvg />,
  tr: <GTranslateSvg />,
  po: <PoeSvg />,
  yt: <YoutubeSvg />,
  pi: <HeyPiIcon />,
  pe: <PerplexityIcon />,
  ch: <CharacterIcon />,
  hu: <HuggingFaceIcon />,
  local: <BackIcon />,
};

export function convertToTabList(platforms) {
  const tabList = [];
  platforms.forEach((platform) => {
    if (platform.state === 'not_shown') return;
    let icon = platformIconMap[platform.alias];
    if (!icon) {
      if (platform.isPlatform) {
        icon = <GoogleSvg />;
      } else {
        icon = getUrlFavicon(platform.url);
      }
    }

    tabList.push({
      ...platform,
      id: platform.alias,
      icon,
    });
  });
  return tabList;
}

export function getNewTabUrlAlias(tabList) {
  const urlTabs = tabList.filter((tab) => tab.alias.startsWith('url'));
  return `url-${urlTabs.length}`;
}

export function findUrlTab(tabList) {
  const urlTab = tabList.find((tab) => tab.alias.startsWith('url'));
  return urlTab;
}

export function isAutoContentSuggestPlatform(alias) {
  return AUTO_CONTENT_SUGGEST_PLATFORMS.includes(alias);
}

export function getPlatformName(tabList, alias) {
  if (alias.startsWith('url')) {
    return 'Custom URL';
  }
  const tab = tabList.find((tab) => tab.alias === alias);
  return tab ? tab.name : '';
}
