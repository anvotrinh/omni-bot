import React, { useContext, useEffect, useRef, useState } from 'react';
import { GitHubIcon, HelpMenuIcon, SettingsIcon, WebsiteIcon } from '../../SVG';
import { AppContext } from '../../App';
import { SETTINGS_PAGE_NAME } from '../../Pages/SettingsPage';
import LogoImage from '../../Images/logo.png';
import LogoHoverImage from '../../Images/logoHover.png';
import './index.scss';
import { focusBlurredSelection } from '../../Input/utils';
import { findUrlTab, getNewTabUrlAlias } from '../../utils/tabList';
import { useSlateStatic } from 'slate-react';
import { getCurrentWebviewId } from '../../utils/tabs';
import { UI_CONFIGS } from '../../config';

const QUTE_WEBSITE = 'https://yahoo.com';

const Logo = () => {
  const {
    inputValue,
    tabList,
    showPage,
    updateTab,
    currentPage,
    addNewTab,
    getAppMargin,
  } = useContext(AppContext);
  const [isShowMenu, setIsShowMenu] = useState(false);
  const [isLogoHover, setIsLogoHover] = useState(false);
  const editor = useSlateStatic();
  const menuDOM = useRef();
  const wrapperDOM = useRef();
  const hideRequestTimeoutId = useRef();
  const showMenuTimeoutId = useRef();
  const isHideFromMenuItem = useRef(false);

  useEffect(() => {
    window.onImagePlaceholderLoaded = () => {
      // case click setting page (current page is webview), hide the button instead
      menuDOM.current.style.opacity =
        currentPage === SETTINGS_PAGE_NAME ? 0 : 1;
    };
  }, [currentPage]);

  useEffect(() => {
    if (isShowMenu) {
      hideRequestTimeoutId.current &&
        clearTimeout(hideRequestTimeoutId.current);

      if (menuDOM.current.style.display !== 'block') {
        menuDOM.current.style.display = 'block';
        // incase: if the webview is hidden, immediate show the menu
        if (currentPage !== '') {
          menuDOM.current.style.opacity = 1;
        } else {
          // incase: if the webview is shown, wait for the screenshot loaded
          window.searchbar?.events?.emit(
            'q1-requestPlaceholder',
            'logo-menu-hover',
          );
        }
      } else {
        // if the placeholder still there, just change the opacity
        menuDOM.current.style.opacity = 1;
      }
    } else {
      menuDOM.current.style.opacity = 0;
      hideRequestTimeoutId.current &&
        clearTimeout(hideRequestTimeoutId.current);

      if (isHideFromMenuItem.current) {
        // hide the menu immediately if menu item click
        menuDOM.current.style.display = 'none';
        window.searchbar?.events?.emit('q1-hidePlaceholder', 'logo-menu-hover');

        isHideFromMenuItem.current = false;
      } else {
        // wait until the animation done and hide placeholder screenshot
        hideRequestTimeoutId.current = setTimeout(() => {
          menuDOM.current.style.display = 'none';

          window.searchbar?.events?.emit(
            'q1-hidePlaceholder',
            'logo-menu-hover',
          );
        }, 250);
      }
    }
  }, [isShowMenu, currentPage]);

  useEffect(() => {
    const inputHeight = document.getElementById('inputWrapper').clientHeight;
    wrapperDOM.current.style.bottom = `${inputHeight + getAppMargin()}px`;
  }, [inputValue, tabList.length, getAppMargin]);

  const handleLogoMouseEnter = () => {
    setIsLogoHover(true);
    // bug when first load app, cause by webviews.selectedId = null
    if (!getCurrentWebviewId()) return;
    showMenuTimeoutId.current && clearTimeout(showMenuTimeoutId.current);
    showMenuTimeoutId.current = setTimeout(() => {
      setIsShowMenu(true);
    }, 150);
  };

  const handleLogoMouseLeave = () => {
    setIsLogoHover(false);
  };

  const handleLogoWrapperMouseLeave = () => {
    // bug when first load app, cause by webviews.selectedId = null
    if (!getCurrentWebviewId()) return;
    showMenuTimeoutId.current && clearTimeout(showMenuTimeoutId.current);
    showMenuTimeoutId.current = null;
    setIsShowMenu(false);
  };

  const handleHelpClick = () => {
    focusBlurredSelection(editor);
    window.ipc.send('q1App-toggleHelp');
    isHideFromMenuItem.current = true;
    setIsShowMenu(false);
  };

  const handleSettingClick = () => {
    focusBlurredSelection(editor);
    showPage(SETTINGS_PAGE_NAME);
    isHideFromMenuItem.current = true;
    setIsShowMenu(false);
  };

  const handleWebsiteClick = (shouldHideMenu) => {
    focusBlurredSelection(editor);

    const { shouldCustomURLOpenInOneTab } = UI_CONFIGS;
    // case: one tab: already opened the url tab
    const urlTab = findUrlTab(tabList);
    if (shouldCustomURLOpenInOneTab && urlTab) {
      if (urlTab.url !== QUTE_WEBSITE) {
        window.searchbar?.events?.emit('q1-updateTab', {
          alias: urlTab.alias,
          url: QUTE_WEBSITE,
        });
      }
      window.searchbar?.events?.emit('q1-changeTab', {
        alias: urlTab.alias,
      });
      updateTab(urlTab.alias, QUTE_WEBSITE);
      shouldHideMenu && setIsShowMenu(false);
      return;
    }
    // case: multiple tab & one tab: first time open the url tab
    const newTabAlias = getNewTabUrlAlias(tabList);
    window.searchbar?.events?.emit('q1-newURLTab', {
      alias: newTabAlias,
      url: QUTE_WEBSITE,
    });
    addNewTab(newTabAlias, QUTE_WEBSITE);
    if (shouldHideMenu) {
      isHideFromMenuItem.current = true;
      setIsShowMenu(false);
    }
  };

  return (
    <div
      className='logoWrapper'
      onMouseLeave={handleLogoWrapperMouseLeave}
      ref={wrapperDOM}
    >
      <div
        className='logo'
        onClick={() => handleWebsiteClick(false)}
        onMouseEnter={handleLogoMouseEnter}
        onMouseLeave={handleLogoMouseLeave}
      >
        <img src={isLogoHover ? LogoHoverImage : LogoImage} alt='logo' />
      </div>
      <div className='menuHover' ref={menuDOM}>
        <div className='menuHover-item' onClick={handleHelpClick}>
          <span>Help</span>
          <div>
            <HelpMenuIcon />
          </div>
        </div>
        <div className='menuHover-item' onClick={handleSettingClick}>
          <span>Settings</span>
          <div>
            <SettingsIcon />
          </div>
        </div>
        <div className='menuHover-item'>
          <span>GitHub</span>
          <div>
            <GitHubIcon />
          </div>
        </div>
        <div
          className='menuHover-item'
          onClick={() => handleWebsiteClick(true)}
        >
          <span>Website</span>
          <div>
            <WebsiteIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logo;
