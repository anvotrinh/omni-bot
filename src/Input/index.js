import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Editable, useSlate } from 'slate-react';

import { AppContext, OPERATION_CHAR, PLATFORM_CHAR } from '../App';
import {
  checkPlatformTagAdjacent,
  getCharBeforeSelection,
  getCurrentAppSearch,
  getInputString,
  getPlatformTagAliasList,
  getTextSearch,
  hideCursor,
  insertPlatformTag,
  isAppChar,
  isAtBeginOfEditor,
  isAtEndOfEditor,
  isSelectionExpanded,
  removeAllText,
  removeOperationSearch,
  removePlatformSearch,
  replaceAllText,
  selectNextBoldText,
  selectionAll,
} from './utils';
import PlatformTag from './PlatformTag';
import {
  getOperationSuggestions,
  getPlatformSuggestions,
} from '../SuggestionList/utils';
import { Transforms } from 'slate';
import { getFullSuggestionText, isInUrlList, isValidUrl } from '../utils/text';
import { findUrlTab, getNewTabUrlAlias } from '../utils/tabList';
import { electronKeyMap } from '../utils/keyboard';
import { CHAT_PLATFORMS, UI_CONFIGS } from '../config';
import SubmitButton from './SubmitButton';
import './index.scss';
import { getTabUrl } from '../utils/tabs';

const DEFAULT_PLACEHOLDER = 'Type a query (or @) to get started';

const isInputScrollable = () => {
  const scrollDOM = document.getElementById('inputScrollWrapper');
  if (!scrollDOM) return false;
  return scrollDOM.scrollHeight > scrollDOM.clientHeight;
};
const sendKeyToWebview = (event) => {
  event.preventDefault();

  const keyCode = electronKeyMap[event.key];
  if (!keyCode) return;

  let modifierKey;
  if (event.altKey) {
    modifierKey = 'alt';
  }

  window.searchbar?.events?.emit('q1-sendKeyboardEvent', {
    keyCode,
    modifierKey,
  });
};
const scrollToBottom = () => {
  const scrollDOM = document.getElementById('inputScrollWrapper');
  if (!scrollDOM) return;
  scrollDOM.scrollTop = scrollDOM.scrollHeight;
};
export const inputScrollToTop = () => {
  const scrollDOM = document.getElementById('inputScrollWrapper');
  if (!scrollDOM) return;
  scrollDOM.scrollTop = 0;
};

const Input = () => {
  const {
    inputValue,
    showPlatformSuggestion,
    showOperationSuggestion,
    showTextSuggestion,
    moveFocusedSuggestion,
    suggestionFocusedIndex,
    textSuggestions,
    curPlatformAlias,
    currentPlatformIconHover,
    isAppJustShown,
    isCurPlatformLoading,
    curBackgroundApp,
    setCurPlatformAlias,
    setShowPlatformSuggestion,
    setShowOperationSuggestion,
    setShowTextSuggestion,
    setSuggestionFocusedIndex,
    setPostponeSubmitText,
    tabList,
    operationList,
    addNewTab,
    updateTab,
    hidePage,
    handleOperationItem,
    submitQuery,
    moveFocusedPastSubmittedQuery,
  } = useContext(AppContext);
  const editor = useSlate();
  const platformSuggestions = getPlatformSuggestions(editor, tabList);
  const operationSuggestions = getOperationSuggestions(
    editor,
    operationList,
    curPlatformAlias,
    curBackgroundApp,
  );
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const [showPlatformHover, setShowPlatformHover] = useState(false);
  const [inputPlaceholders, setInputPlaceholders] = useState({});
  const waitToShowHoverTimeoutId = useRef();
  const showHoverTimeoutId = useRef();
  const submitButtonRef = useRef(null);
  const inputScrollWrapperDOM = useRef();
  const fakeInputScrollWrapperDOM = useRef();

  useEffect(() => {
    // after 3000ms the platform title auto hide
    showHoverTimeoutId.current && clearTimeout(showHoverTimeoutId.current);
    showHoverTimeoutId.current = setTimeout(() => {
      setShowPlatformHover(false);
    }, 3300);

    waitToShowHoverTimeoutId.current &&
      clearTimeout(waitToShowHoverTimeoutId.current);
    if (currentPlatformIconHover) {
      // after 300ms the platform title show
      waitToShowHoverTimeoutId.current = setTimeout(() => {
        setShowPlatformHover(true);
      }, 300);
    } else {
      setShowPlatformHover(false);
    }
  }, [currentPlatformIconHover]);

  useEffect(() => {
    const scrollDOM = document.getElementById('inputScrollWrapper');
    if (isInputScrollable()) {
      scrollDOM.classList.add('scrollable');
    } else {
      scrollDOM.classList.remove('scrollable');
    }
  }, [inputValue]);

  useEffect(() => {
    window.changeInputPlaceholder = ({ tabAlias, event }) => {
      if (tabAlias !== curPlatformAlias) return;
      if (event !== 'did-start-loading' && event !== 'did-start-navigation') {
        const platformInfo = tabList.find(
          (tab) => tab.alias === curPlatformAlias,
        );
        const {
          loginUrls = [],
          loginPlaceholder = '',
          chooseBotUrls = [],
          chooseBotPlaceholder = '',
        } = platformInfo;
        const currentUrl = getTabUrl(tabAlias);

        // check login page
        const isOnLoginPage = isInUrlList(loginUrls, currentUrl);
        const isOnChooseBotPage = isInUrlList(chooseBotUrls, currentUrl);
        let nextPlaceholder;
        if (isOnLoginPage) {
          nextPlaceholder = loginPlaceholder;
        } else if (isOnChooseBotPage) {
          nextPlaceholder = chooseBotPlaceholder;
        } else {
          nextPlaceholder = DEFAULT_PLACEHOLDER;
        }
        setInputPlaceholders((inputPlaceholders) => ({
          ...inputPlaceholders,
          [curPlatformAlias]: nextPlaceholder,
        }));
      }
    };
  }, [tabList, curPlatformAlias]);

  useEffect(() => {
    window.updateFakeInputScrollWrapper = () => {
      const { x, y, width, height } =
        inputScrollWrapperDOM.current.getBoundingClientRect();
      window.ipc.send('q1App-getMainCapture', { x, y, width, height });
      fakeInputScrollWrapperDOM.current.style.left = `${x}px`;
      fakeInputScrollWrapperDOM.current.style.top = `${y}px`;
      fakeInputScrollWrapperDOM.current.style.width = `${width}px`;
      fakeInputScrollWrapperDOM.current.style.height = `${height}px`;
    };
    window.ipc.on('q1App-resultMainCapture', (e, { url }) => {
      fakeInputScrollWrapperDOM.current.src = url;
    });
  }, []);

  const handleSubmit = () => {
    editor.lastSubmittedTime = new Date().getTime();
    setShowPlatformSuggestion(false);
    setShowOperationSuggestion(false);
    setShowTextSuggestion(false);
    hidePage(); // hide page if it open

    // dont submit if no query
    if (!getInputString(editor)) return;

    if (isCurPlatformLoading) {
      setPostponeSubmitText(getTextSearch(editor));
    } else {
      submitQuery(getTextSearch(editor));
    }

    if (CHAT_PLATFORMS.includes(curPlatformAlias)) {
      removeAllText(editor, curPlatformAlias);
    }

    editor.justSubmittedSearch = true;
  };

  const onKeyDown = (event) => {
    if (!event.altKey && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      hidePage(); // hide page if it open
      window.hideFindInPage && window.hideFindInPage(); // hide find in page
    }
    // hide platform suggestion
    if (
      [
        'ArrowLeft',
        'ArrowRight',
        'PageUp',
        'PageDown',
        'Tab',
        'Home',
        'End',
      ].includes(event.key)
    ) {
      editor.isAbleToShowAppSuggestionAgain = false;
      setShowPlatformSuggestion(false);
      setShowOperationSuggestion(false);
    }

    switch (event.key) {
      case 'ArrowDown':
        if (event.altKey) {
          event.preventDefault();
          moveFocusedPastSubmittedQuery(-1);
          return;
        }
        if (
          (showPlatformSuggestion && platformSuggestions.length > 0) ||
          (showOperationSuggestion && operationSuggestions.length > 0) ||
          (showTextSuggestion && textSuggestions.length > 0)
        ) {
          event.preventDefault();
          moveFocusedSuggestion(1);
          return;
        }
        break;
      case 'ArrowUp':
        if (event.altKey) {
          event.preventDefault();
          moveFocusedPastSubmittedQuery(1);
          return;
        }
        if (
          (showPlatformSuggestion && platformSuggestions.length > 0) ||
          (showOperationSuggestion && operationSuggestions.length > 0) ||
          (showTextSuggestion && textSuggestions.length > 0)
        ) {
          event.preventDefault();
          moveFocusedSuggestion(-1);
          return;
        }
        break;
      case 'ArrowLeft':
        if (event.altKey) {
          sendKeyToWebview(event);
          return;
        }
        if (isSelectionExpanded(editor)) return;
        if (!checkPlatformTagAdjacent(editor).hasAtLeft) return;
        Transforms.move(editor, { reverse: true });
        break;
      case 'ArrowRight':
        if (event.altKey) {
          sendKeyToWebview(event);
          return;
        }
        if (isSelectionExpanded(editor)) return;
        if (!checkPlatformTagAdjacent(editor).hasAtRight) return;
        Transforms.move(editor);
        break;
      case ' ':
      case 'Tab':
      case 'Enter':
        if (event.key === 'Enter' && (event.shiftKey || event.ctrlKey)) {
          event.preventDefault();
          editor.insertText('\n');
          if (isAtEndOfEditor(editor)) {
            setTimeout(scrollToBottom);
          }
          return;
        }
        if (event.key === 'Tab' && event.ctrlKey) {
          event.preventDefault();
          if (event.shiftKey) {
            window.switchToPreviousPlatform &&
              window.switchToPreviousPlatform();
          } else {
            window.switchToNextPlatform && window.switchToNextPlatform();
          }
          return;
        }

        const { search: platformSearch } = getCurrentAppSearch(
          editor,
          PLATFORM_CHAR,
        );
        if (showPlatformSuggestion) {
          event.preventDefault();
          if (platformSuggestions.length === 0) return;
          // enter platform suggestion case
          const item = platformSuggestions[suggestionFocusedIndex];
          insertPlatformTag(editor, item);
          inputScrollToTop();
          setShowPlatformSuggestion(false);
          setShowOperationSuggestion(false);
          setShowTextSuggestion(false);
          // if first tag, jump to that tab
          if (getPlatformTagAliasList(editor).length === 1) {
            setCurPlatformAlias(item.alias);
            window.searchbar?.events?.emit('q1-changeTab', {
              alias: item.alias,
            });
          }
        } else if (isValidUrl(platformSearch) && event.key === 'Enter') {
          event.preventDefault();
          // open url case
          setShowPlatformSuggestion(false);
          setShowTextSuggestion(false);

          const { shouldCustomURLOpenInOneTab } = UI_CONFIGS;

          removePlatformSearch(editor);
          // case: one tab: already opened the url tab
          const urlTab = findUrlTab(tabList);
          if (shouldCustomURLOpenInOneTab && urlTab) {
            window.searchbar?.events?.emit('q1-updateTab', {
              alias: urlTab.alias,
              url: platformSearch,
            });
            window.searchbar?.events?.emit('q1-changeTab', {
              alias: urlTab.alias,
            });
            updateTab(urlTab.alias, platformSearch);
            return;
          }
          // case: multiple tab & one tab: first time open the url tab
          const newTabAlias = getNewTabUrlAlias(tabList);
          window.searchbar?.events?.emit('q1-newURLTab', {
            url: platformSearch,
            alias: newTabAlias,
          });
          addNewTab(newTabAlias, platformSearch);
        } else if (showOperationSuggestion) {
          if (event.key === ' ') return;
          event.preventDefault();
          if (operationSuggestions.length === 0) return;
          const item = operationSuggestions[suggestionFocusedIndex];
          handleOperationItem(item);
        } else if (textSuggestions.length > 0) {
          // enter text suggestion case
          if (event.key === ' ') return;
          event.preventDefault();
          const item = textSuggestions[suggestionFocusedIndex];
          const fullSuggestionText = getFullSuggestionText(
            curPlatformAlias,
            item.name,
            getInputString(editor),
          );
          replaceAllText(editor, fullSuggestionText);
          setShowTextSuggestion(false);
          if (event.key === 'Enter') {
            submitButtonRef.current.playAnimation();
            handleSubmit();
            editor.justSubmitedTextSuggestion = true;
          }
        } else {
          // submit case, normal enter
          if (event.key === 'Enter') {
            event.preventDefault();
            // if user isn't logged in, show an alert message
            const curInputPlaceholder =
              inputPlaceholders[curPlatformAlias] || DEFAULT_PLACEHOLDER;
            if (curInputPlaceholder !== DEFAULT_PLACEHOLDER) {
              window.showAlertBarFlashMessage &&
                window.showAlertBarFlashMessage(
                  inputPlaceholders[curPlatformAlias],
                );
              return;
            }
            submitButtonRef.current.playAnimation();
            handleSubmit();
          }
          // tab case, normal tab
          if (event.key === 'Tab') {
            event.preventDefault();
            selectNextBoldText(editor, event.shiftKey);
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (
          (showPlatformSuggestion && platformSuggestions.length > 0) ||
          (showTextSuggestion && textSuggestions.length > 0) ||
          (showOperationSuggestion && operationSuggestions.length > 0)
        ) {
          setShowPlatformSuggestion(false);
          setShowOperationSuggestion(false);
          setShowTextSuggestion(false);
        } else {
          window.ipc.send('q1-hideApp');
        }
        break;
      case PLATFORM_CHAR:
        // if the char before / is number, don't show platform suggestion
        // if (/\d/.test(getCharBeforeSelection(editor))) {
        //   return;
        // }
        setSuggestionFocusedIndex(0);
        setShowPlatformSuggestion(true);
        setShowOperationSuggestion(false);
        setShowTextSuggestion(false);
        editor.isAbleToShowAppSuggestionAgain = true;
        break;
      case OPERATION_CHAR:
        if (!UI_CONFIGS.operationsEnabled) return;
        // if the char before / is NOT space, don't show operation suggestion
        if (/\S/.test(getCharBeforeSelection(editor))) return;
        setSuggestionFocusedIndex(0);
        setShowOperationSuggestion(true);
        setShowPlatformSuggestion(false);
        setShowTextSuggestion(false);
        editor.isAbleToShowAppSuggestionAgain = true;
        break;
      case 'r':
        if (!event.metaKey && !event.ctrlKey) return;
        window.reloadCurrentTab();
        break;
      case 'F5':
        window.reloadCurrentTab();
        break;
      case 'Backspace':
        // platform suggestion show again
        if (editor.isAbleToShowAppSuggestionAgain) {
          const charBefore = getCharBeforeSelection(editor);
          if (isAppChar(charBefore) || charBefore === '') {
            editor.isAbleToShowAppSuggestionAgain = false;
          } else {
            const { target: platformTarget } = getCurrentAppSearch(
              editor,
              PLATFORM_CHAR,
            );
            const { target: operationTarget } = getCurrentAppSearch(
              editor,
              OPERATION_CHAR,
            );
            if (platformTarget) {
              setShowPlatformSuggestion(true);
            } else if (UI_CONFIGS.operationsEnabled && operationTarget) {
              setShowOperationSuggestion(true);
            }
          }
        }

        // remove tag case
        if (isSelectionExpanded(editor)) return;
        if (!checkPlatformTagAdjacent(editor).hasAtLeft) return;
        event.preventDefault();

        Transforms.delete(editor, { reverse: true });
        if (!isAtBeginOfEditor(editor)) {
          Transforms.move(editor);
        }
        // if removed current tag, then change to new 1st tag
        const curTagList = getPlatformTagAliasList(editor);
        if (curTagList.length >= 1 && !curTagList.includes(curPlatformAlias)) {
          setCurPlatformAlias(curTagList[0]);
          window.searchbar?.events?.emit('q1-changeTab', {
            alias: curTagList[0],
          });
        }
        break;
      case 'Home':
        editor.isJustPressedHome = true;
        break;
      case 'PageUp':
      case 'PageDown':
        // input is not scrollable -> send key to webview
        // input scrollable, submited search & haven't edit the text -> send key to webview
        if (isInputScrollable() && !editor.justSubmittedSearch) return;
        sendKeyToWebview(event);
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (!event.metaKey && !event.ctrlKey) return;
        event.preventDefault();
        window.switchToPlatformByNumber &&
          window.switchToPlatformByNumber(event.key);
        break;
      default:
        break;
    }
  };

  return (
    <div id='inputWrapper' className='inputWrapper'>
      <div
        className='inputScrollWrapper'
        id='inputScrollWrapper'
        ref={inputScrollWrapperDOM}
      >
        <Editable
          className='composeBox'
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          onBlur={() => {
            editor.blurSelection = editor.selection;
          }}
          onFocus={() => {
            window.hideFindInPage && window.hideFindInPage();
          }}
          placeholder={
            inputPlaceholders[curPlatformAlias] || DEFAULT_PLACEHOLDER
          }
        />
      </div>
      <SubmitButton ref={submitButtonRef} onSubmit={handleSubmit} />
      {currentPlatformIconHover !== '' &&
        showPlatformHover &&
        !isAppJustShown && (
          <div className='platformTitleText'>{currentPlatformIconHover}</div>
        )}
      <img
        id='fakeInputScrollWrapper'
        ref={fakeInputScrollWrapperDOM}
        alt='fake input'
      />
    </div>
  );
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  return <span {...attributes}>{children}</span>;
};

const Element = (props) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case 'platformTag':
      return <PlatformTag {...props} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export default Input;
