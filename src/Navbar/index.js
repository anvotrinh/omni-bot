import React, { useContext, useEffect, useRef, useState } from 'react';
import cx from 'classnames';

import {
  BackIcon,
  CloseIcon,
  CopiedIcon,
  CopyIcon,
  ForwardIcon,
  HelpIcon,
  MinimizeIcon,
  NavSettingsIcon,
  PinActiveSvg,
  PinSvg,
  ReloadIcon,
  SnapWindowIcon,
} from '../SVG';
import { getCurrentTabUrl } from '../utils/tabs';
import { copyToClipboard } from '../utils/dom';
import { AppContext } from '../App';
import { SETTINGS_PAGE_NAME } from '../Pages/SettingsPage';
import IconButton from '../Component/IconButton';
import AppRegionDrag from './AppRegionDrag';
import { getPlatformName } from '../utils/tabList';
import './index.scss';
import { focusBlurredSelection } from '../Input/utils';
import { useSlateStatic } from 'slate-react';
import NavbarNotification from './NavbarNotification';
import { UI_CONFIGS } from '../config';

const Navbar = () => {
  const {
    isAlwaysOnTop,
    currentPage,
    showPage,
    setIsAlwaysOnTop,
    tabList,
    curPlatformAlias,
    setShowPlatformSuggestion,
    setShowOperationSuggestion,
    setShowTextSuggestion,
  } = useContext(AppContext);
  const editor = useSlateStatic();
  const [isCopied, setIsCopied] = useState(false);
  const [isShowTitle, setIsShowTitle] = useState(true);
  const [isShowButtons, setIsShowButtons] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isAlwaysShowButtons, setIsAlwaysShowButtons] = useState(false);
  const [isAlwaysHideButtons, setIsAlwaysHideButtons] = useState(false);
  const [isHoverCloseBtn, setIsHoverCloseBtn] = useState(false);
  const enableButtonTimeoutId = useRef();
  const showTitleTimeoutId = useRef();
  const hideButtonTimeoutId = useRef();
  const isForceShowingButtons = useRef(false);
  const isShowButtonsAfterForceShowingButtons = useRef(false);

  useEffect(() => {
    window.ipc.on('q1-appShowMenuButton', function () {
      setIsShowButtons(true);
      setIsShowTitle(false);
      if (isForceShowingButtons.current) {
        setIsButtonDisabled(false);
        isShowButtonsAfterForceShowingButtons.current = true;
        return;
      }

      // title clear timeout
      showTitleTimeoutId.current && clearTimeout(showTitleTimeoutId.current);
      showTitleTimeoutId.current = null;
      // enable button
      enableButtonTimeoutId.current &&
        clearTimeout(enableButtonTimeoutId.current);
      enableButtonTimeoutId.current = setTimeout(() => {
        setIsButtonDisabled(false);
      }, 250);
    });

    window.ipc.on('q1-appHideMenuButton', function () {
      setIsShowButtons(false);
      setIsButtonDisabled(true);
      if (isForceShowingButtons.current) {
        isShowButtonsAfterForceShowingButtons.current = false;
        return;
      }

      // show title
      showTitleTimeoutId.current && clearTimeout(showTitleTimeoutId.current);
      showTitleTimeoutId.current = setTimeout(() => {
        setIsShowTitle(true);
      }, 250);
      // enable button clear timeout
      enableButtonTimeoutId.current &&
        clearTimeout(enableButtonTimeoutId.current);
      enableButtonTimeoutId.current = null;
    });

    window.ipc.on('q1App-showNavbarButtons', function () {
      setIsShowTitle(false);
      setIsAlwaysShowButtons(true);
      isShowButtonsAfterForceShowingButtons.current = false;
      isForceShowingButtons.current = true;
    });
    window.ipc.on('q1App-hideNavbarButtons', function () {
      setIsAlwaysShowButtons(false);
      isForceShowingButtons.current = false;
      // if the cursor is not in the menubar, show title
      if (!isShowButtonsAfterForceShowingButtons.current) {
        showTitleTimeoutId.current && clearTimeout(showTitleTimeoutId.current);
        showTitleTimeoutId.current = setTimeout(() => {
          setIsShowTitle(true);
        }, 250);
      }
    });

    window.ipc.on('appHide', function () {
      setIsAlwaysHideButtons(true);
      setIsHoverCloseBtn(false);
    });

    window.ipc.on('appShow', function () {
      setIsAlwaysHideButtons(true);
      setIsHoverCloseBtn(false);

      hideButtonTimeoutId.current && clearTimeout(hideButtonTimeoutId.current);
      hideButtonTimeoutId.current = setTimeout(() => {
        setIsAlwaysHideButtons(false);
      }, 300);
    });
  }, []);

  const handleCopyLink = () => {
    setIsCopied(true);
    copyToClipboard(getCurrentTabUrl());
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  const handlePinClick = () => {
    window.searchbar?.events?.emit('q1-setAlwaysOnTop', {
      value: !isAlwaysOnTop,
    });
    setIsAlwaysOnTop(!isAlwaysOnTop);
  };

  // const handleSnapWindow = () => {
  //   window.searchbar?.events?.emit('q1-toggleWindowPosition');
  // };

  const handleSettingsClick = () => {
    setShowPlatformSuggestion(false);
    setShowOperationSuggestion(false);
    setShowTextSuggestion(false);
    showPage(SETTINGS_PAGE_NAME);
  };

  const handleHelpClick = () => {
    setShowPlatformSuggestion(false);
    setShowOperationSuggestion(false);
    setShowTextSuggestion(false);
    window.ipc.send('q1App-toggleHelp');
    focusBlurredSelection(editor);
  };

  const handleMinimize = () => {
    window.searchbar?.events?.emit('q1-minimize');
  };

  const handleToggleMaximize = () => {
    window.ipc.send('q1App-toggleMaximize');
    focusBlurredSelection(editor);
  };

  const handleClose = () => {
    window.ipc.send('q1App-hideWindow');
  };

  const handleReload = () => {
    window.reloadCurrentTab();
  };

  const handleDoubleClick = () => {
    window.ipc.send('q1App-toggleMaximize');
    focusBlurredSelection(editor);
  };

  const wrapperStyle = {
    display: currentPage === '' ? 'flex' : 'none',
  };
  const buttonStyle = {
    opacity: isShowButtons || isAlwaysShowButtons ? 1 : 0,
    visibility: isAlwaysHideButtons ? 'hidden' : 'visible',
  };
  const navButtonWrapper = (
    <div
      className='navButtonWrapper'
      style={wrapperStyle}
      onDoubleClick={handleDoubleClick}
    >
      {isButtonDisabled && <div className='fullRegionDrag' />}
      {(isShowTitle || isAlwaysHideButtons) && (
        <span>{getPlatformName(tabList, curPlatformAlias)}</span>
      )}
      <AppRegionDrag width={16} />
      <IconButton
        id='back-button'
        title='Go Back'
        onMouseUp={() => focusBlurredSelection(editor)}
      >
        <BackIcon />
      </IconButton>
      <AppRegionDrag width={12} />
      <IconButton
        id='forward-button'
        title='Go Forward'
        onMouseUp={() => focusBlurredSelection(editor)}
      >
        <ForwardIcon />
      </IconButton>
      <AppRegionDrag width={12} />
      <IconButton title='Reload' onClick={handleReload}>
        <ReloadIcon />
      </IconButton>
      <AppRegionDrag width='full' />
      <div className='navAdditionButtons'>
        <IconButton
          title='Copy Link'
          onClick={handleCopyLink}
          style={buttonStyle}
        >
          {isCopied ? <CopiedIcon /> : <CopyIcon />}
        </IconButton>
        <AppRegionDrag width={12} />
        <IconButton title='Help' onClick={handleHelpClick} style={buttonStyle}>
          <HelpIcon />
        </IconButton>
        <AppRegionDrag width={12} />
        <IconButton
          title='Settings'
          onClick={handleSettingsClick}
          style={buttonStyle}
        >
          <NavSettingsIcon />
        </IconButton>
        <AppRegionDrag width={12} />
        <IconButton
          className='navButtonWrapper-pin'
          title='Pin'
          onClick={handlePinClick}
          style={buttonStyle}
        >
          {isAlwaysOnTop ? <PinActiveSvg /> : <PinSvg />}
        </IconButton>
        {/* <IconButton title='Snap' onClick={handleSnapWindow} style={buttonStyle}>
        <SnapWindowIcon />
      </IconButton> */}
        <AppRegionDrag width={12} />
      </div>
      <IconButton title='Minimize' onClick={handleMinimize}>
        <MinimizeIcon />
      </IconButton>
      <AppRegionDrag width={12} />
      {UI_CONFIGS.maximizeEnabled && (
        <>
          <IconButton title='Maximize' onClick={handleToggleMaximize}>
            <SnapWindowIcon />
          </IconButton>
          <AppRegionDrag width={12} />
        </>
      )}
      <IconButton
        className={cx({
          noCSSHover: true,
          hover: isHoverCloseBtn,
        })}
        title='Close'
        onClick={handleClose}
        onMouseEnter={() => setIsHoverCloseBtn(true)}
        onMouseLeave={() => setIsHoverCloseBtn(false)}
      >
        <CloseIcon />
      </IconButton>
      <AppRegionDrag width={16} />
    </div>
  );
  return (
    <div id='topMenuBar'>
      {navButtonWrapper}
      <NavbarNotification />
    </div>
  );
};

export default Navbar;
