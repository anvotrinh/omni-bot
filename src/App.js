import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ReactEditor, Slate, withReact } from 'slate-react';
import { Range, Transforms, createEditor } from 'slate';
import { withHistory } from 'slate-history';

import './App.scss';
import './Component/FindInPage/index.scss';
import Input from './Input';
import PlatformBar, { emitLayoutResize } from './PlatformBar';
import PlatformSuggestionList from './SuggestionList/PlatformSuggestionList';
import TextSuggestionList from './SuggestionList/TextSuggestionList';
import {
  focusBlurredSelection,
  getCurrentAppSearch,
  getInputString,
  getPlatformTagAliasList,
  getTextSearch,
  insertPromptTemplate,
  isEqualRange,
  isSelectionExpanded,
  normalizeSelection,
  removeAllPlatformTag,
  removeOperationSearch,
  replaceAllText,
  selectionAll,
  withEditor,
  withPlatformTags,
} from './Input/utils';
import {
  getOperationSuggestions,
  getPlatformSuggestions,
} from './SuggestionList/utils';
import Navbar from './Navbar';
import SettingsPage from './Pages/SettingsPage';
import LoadingPage from './Pages/LoadingPage';
import { convertToTabList } from './utils/tabList';
import LoadingLine from './Input/LoadingLine';
import { getUrlFavicon, parseTextSearch } from './utils/text';
import { isAutoContentSuggestPlatform } from './utils/tabList';
import { isTabSleeping } from './utils/tabs';
import UploadFileBar from './UploadFileBar';
import Logo from './Component/Logo';
import Popup from './Component/UpdatePopup';
import { UI_CONFIGS } from './config';
import NoticePopup from './Component/NoticePopup';
import AppOverlay from './Component/AppOverlay';
import DropZone from './Component/DropZone';
import AlertBar from './AlertBar';
import OperationSuggestionList from './SuggestionList/OperationSuggestionList';
import CreateOperationPage, {
  CREATE_OPERATION_PAGE_NAME,
} from './Pages/CreateOperationPage';
import OperationBar from './OperationBar';

const HIGHLIGHT_FOCUS_BACK_TIME = 60000;
// used to show platform suggestion
export const PLATFORM_CHAR = '@';
// used to show operation suggestion
export const OPERATION_CHAR = '/';
export const DEFAULT_APP_MARGIN = 0;

const OPERATION_PAGES = [CREATE_OPERATION_PAGE_NAME];

const initialInputValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
];

export const AppContext = React.createContext();

function App() {
  const [inputValue, setInputValue] = useState([]);
  const inputValueRef = useRef();
  inputValueRef.current = inputValue;

  const [curPlatformAlias, baseSetCurPlatformAlias] = useState('gp');
  const [showPlatformSuggestion, setShowPlatformSuggestion] = useState(false);
  const [showTextSuggestion, setShowTextSuggestion] = useState(false);
  const [showOperationSuggestion, setShowOperationSuggestion] = useState(false);
  const [operationList, setOperationList] = useState([]);
  const [activeOperations, setActiveOperations] = useState([]);
  const [tabList, setTabList] = useState([]);
  const [textSuggestions, setTextSuggestions] = useState([]);
  const [currentPage, setCurrentPage] = useState('');
  const [suggestionFocusedIndex, setSuggestionFocusedIndex] = useState(0);
  const [currentPlatformIconHover, setCurrentPlatformIconHover] = useState('');
  const [isAppJustShown, setIsAppJustShown] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isUpdateNotificationShown, setIsUpdateNotificationShown] =
    useState(false);
  const [isCurPlatformLoading, setIsCurPlatformLoading] = useState(false);
  const [postponeSubmitText, setPostponeSubmitText] = useState('');
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [pastSubmittedQueries, setPastSubmittedQueries] = useState({});
  const [pastSubmittedQueryFocusedIndex, setPastSubmittedQueryFocusedIndex] =
    useState(-1);
  // for settings page
  const [settings, setSettings] = useState({
    maxMemoryMB: 0,
    showHotKey: '',
    isStartWhenPCStart: false,
  });
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [curBackgroundApp, setCurBackgroundApp] = useState('');
  const prevSelection = useRef();

  const editor = useMemo(
    () => withEditor(withPlatformTags(withReact(withHistory(createEditor())))),
    [],
  );

  const prevInputString = useRef('');
  const lastActiveTime = useRef(0);
  const setSuggestionFirstResultTimeoutId = useRef();
  const platformSuggestions = getPlatformSuggestions(editor, tabList);
  const operationSuggestions = getOperationSuggestions(
    editor,
    operationList,
    curPlatformAlias,
    curBackgroundApp,
  );
  const platformTagList = getPlatformTagAliasList(editor);

  const setCurPlatformAlias = (alias, clickFrom) => {
    const showSuggestionConfig = UI_CONFIGS.keepShowingSuggestion;

    let shouldShowCurResult = true;
    let shouldKeepLastSuggestion = false;
    if (clickFrom === 'platformBar') {
      if (alias === curPlatformAlias) {
        shouldShowCurResult = showSuggestionConfig['self-PlatformBarClick'];
        // keep the current text suggestions
        shouldKeepLastSuggestion = shouldShowCurResult;
      } else if (platformTagList.includes(alias)) {
        shouldShowCurResult = showSuggestionConfig['otherTag-PlatformBarClick'];
      } else {
        shouldShowCurResult = showSuggestionConfig['rest-PlatformBarClick'];
      }
    } else if (clickFrom === 'platformTag') {
      if (alias === curPlatformAlias) {
        shouldShowCurResult = showSuggestionConfig['self-PlatformTagClick'];
        // keep the current text suggestions
        shouldKeepLastSuggestion = shouldShowCurResult;
      } else if (platformTagList.includes(alias)) {
        shouldShowCurResult = showSuggestionConfig['otherTag-PlatformTagClick'];
      }
    }
    // keep hide suggestion if user already turn it off
    if (!showTextSuggestion) {
      shouldShowCurResult = false;
    }

    // if same tab, just keep/not keep last suggestion base on options
    if (alias === curPlatformAlias) {
      if (!shouldKeepLastSuggestion) {
        setShowTextSuggestion(false);
      }
      return;
    } else {
      window.ipc.send('q1View-selectionChange', { triggerHide: true });
    }
    // to other tab, send input again to trigger the autosuggestion
    setTextSuggestions([]);
    baseSetCurPlatformAlias(alias);
    setPastSubmittedQueryFocusedIndex(-1);

    // update input placeholder while changing platform
    setTimeout(() => {
      if (!window.changeInputPlaceholder) return;
      window.changeInputPlaceholder({
        tabAlias: alias,
        event: 'change-platform-tab',
      });
    }, 25);

    const inputString = getInputString(editor);
    if (inputString && shouldShowCurResult) {
      // if (isTabSleeping(alias)) {
      //   setShowTextSuggestion(false);
      //   return;
      // }

      // wait next platform load
      setTimeout(() => {
        // only turn on show suggestion text for platforms have it
        setShowTextSuggestion(isAutoContentSuggestPlatform(alias));
        window.searchbar?.events?.emit('q1-input', {
          value: '',
        });
        window.searchbar?.events?.emit('q1-input', {
          value: getTextSearch(editor),
        });
      }, 100);
    }
  };

  useEffect(() => {
    window.ipc.on('loadPlatformsAndUserData', function (event, data) {
      const { platforms, userData, defaultIsStartWhenPCStart, appVersion } =
        data;
      setCurPlatformAlias(userData.lastUsedPlatformAlias);
      setTabList(convertToTabList(platforms));
      setOperationList(userData.operations);
      setSettings({
        maxMemoryMB: userData.maxMemoryMB,
        showHotKey: userData.showHotKey.replace(/\+/g, ' + '),
        isStartWhenPCStart: defaultIsStartWhenPCStart,
        appVersion,
      });

      if (!userData.isCompletedHelpTutorial) {
        setTimeout(() => {
          window.ipc.send('q1App-toggleHelp');
        }, 1000);
      }
    });
    ReactEditor.focus(editor);
    window.ipc.on('appFocus', function (event, data) {
      const isFocusedMainBefore =
        Math.abs(data.lastActiveTime - lastActiveTime.current) < 500;
      if (
        new Date().getTime() - lastActiveTime.current <=
          HIGHLIGHT_FOCUS_BACK_TIME &&
        isFocusedMainBefore
      ) {
        focusBlurredSelection(editor);
        return;
      }
      selectionAll(editor);
    });
    window.ipc.on('q1-hotkeyFocus', function (e, data) {
      if (!data.isFocusedMain) {
        ReactEditor.focus(editor);
        selectionAll(editor);
        return;
      }
      if (ReactEditor.isFocused(editor)) {
        window.ipc.send('q1-hideApp');
        return;
      }
      const settingsHotkeyInputDOM = document.getElementById('q1-hotkeyInput');
      if (
        settingsHotkeyInputDOM &&
        settingsHotkeyInputDOM === document.activeElement
      ) {
        setSettings((settings) => ({
          ...settings,
          showHotKey: data.showHotKey.split('+').join(' + '),
        }));
        return;
      }
      ReactEditor.focus(editor);
      selectionAll(editor);
    });
    window.addEventListener('blur', () => {
      lastActiveTime.current = new Date().getTime();
    });
    window.ipc.on('appFocusBack', function (e, data) {
      focusBlurredSelection(editor);
    });
    window.ipc.on('q1App-setFocusedIndex', function (e, data) {
      setSuggestionFocusedIndex(data.focusedIndex);
    });
    window.ipc.on('q1App-changeOpacity', function (e, data) {
      const { topMenuBar, platformBar, composeBox } = data;
      document.getElementById('topMenuBar').style.opacity = topMenuBar;
      document.getElementById('platformBar').style.opacity = platformBar;
      document.getElementById('inputWrapper').style.opacity = composeBox;
    });
    window.ipc.on('q1App-receiveOperationList', function (e, data) {
      data.operations && setOperationList(data.operations);
    });
    window.ipc.on('maximize', function () {
      setIsWindowMaximized(true);
    });
    window.ipc.on('unmaximize', function () {
      setIsWindowMaximized(false);
    });
    window.ipc.on('q1App-insertText', function (e, data) {
      focusBlurredSelection(editor);
      editor.insertText(data.text);
    });
    window.ipc.on('q1-screenSizeClass', function (e, data) {
      setTimeout(() => {
        emitLayoutResize();
      }, 1000);
    });
    window.ipc.send('q1App-initGetBackgroundApp');
    window.ipc.on('q1App-receiveBackgroundApp', function (e, { appName }) {
      setCurBackgroundApp(appName.trim());
    });
    window.ipc.on('q1App-replaceComposeBoxText', function (e, { text }) {
      focusBlurredSelection(editor);
      replaceAllText(editor, text);
    });
    window.ipc.send('q1App-checkLocalBaseInstalled');
    // recalculate window pos for MacOS, since 'moved' doesn't work on MacOS
    // mouse up in dragarea
    //  ->   window.ipc.send('calculateWindowPosition');
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let appHideTimeout;
    window.ipc.on('appShow', function (e, data) {
      // to hide the platform text
      setCurrentPlatformIconHover('');
      setIsAppJustShown(true);

      appHideTimeout && clearTimeout(appHideTimeout);
      appHideTimeout = setTimeout(() => {
        document.body.classList.remove('app-hide');
      }, 25);
    });
    window.ipc.on('appHide', function (e, data) {
      // to hide the platform text
      setCurrentPlatformIconHover('');
      setIsAppJustShown(true);

      document.body.classList.add('app-hide');
    });
  }, []);

  useEffect(() => {
    window.onAutoSuggestion = (tabAlias, res) => {
      if (tabAlias !== curPlatformAlias) return;
      if (res.length === 0) return;
      let data;
      if (Array.isArray(res[0])) {
        // receive from browserUI.js
        data = res[0];
      } else {
        // receive from main.js
        data = res;
      }

      const inputString = getInputString(editor);
      if (!inputString) {
        setShowTextSuggestion(false);
        return;
      }
      const textSuggestions = [
        { name: inputString, decs: '', icon: '' },
        ...data,
      ];
      setTextSuggestions(textSuggestions);
      setSuggestionFocusedIndex(0);
    };
  }, [curPlatformAlias, editor]);

  useEffect(() => {
    window.searchbar?.events?.emit('q1-updatePlatformBgList', {
      bgList: platformTagList,
    });
  }, [platformTagList]);

  const moveFocusedSuggestion = (direction) => {
    let nextIndex = suggestionFocusedIndex + direction;
    if (showPlatformSuggestion && platformSuggestions.length > 0) {
      if (nextIndex < 0) {
        nextIndex = platformSuggestions.length - 1;
      } else if (nextIndex >= platformSuggestions.length) {
        nextIndex = 0;
      }
    } else if (showOperationSuggestion && operationSuggestions.length > 0) {
      if (nextIndex < 0) {
        nextIndex = operationSuggestions.length - 1;
      } else if (nextIndex >= operationSuggestions.length) {
        nextIndex = 0;
      }
    } else if (textSuggestions.length > 0) {
      if (nextIndex < 0) {
        nextIndex = textSuggestions.length - 1;
      } else if (nextIndex >= textSuggestions.length) {
        nextIndex = 0;
      }
    }
    setSuggestionFocusedIndex(nextIndex);
  };

  const addNewTab = (alias, url) => {
    setTabList([
      ...tabList,
      {
        id: alias,
        url,
        alias,
        icon: getUrlFavicon(url),
      },
    ]);
    setCurPlatformAlias(alias);
  };

  const updateTab = (alias, url) => {
    const updatedTabList = tabList.map((tab) => {
      if (tab.alias === alias) {
        return {
          ...tab,
          url,
          icon: getUrlFavicon(url),
        };
      }
      return tab;
    });
    setTabList(updatedTabList);
    setCurPlatformAlias(alias);
  };

  const updateSuggestionFirstResult = () => {
    setTextSuggestions((textSuggestions) => {
      const curInputString = getInputString(editor);
      return textSuggestions.map((s, i) => {
        if (i === 0) return { name: curInputString };
        return s;
      });
    });
  };
  const handleInputStringChange = () => {
    const curInputString = getInputString(editor);
    // send input
    if (prevInputString.current !== curInputString) {
      if (curInputString) {
        // enter/click text suggestion already submit an input
        if (!editor.justSubmitedTextSuggestion) {
          if (!showTextSuggestion) {
            setTextSuggestions([]);
          }
          // only turn on show suggestion text for platforms have it
          setShowTextSuggestion(isAutoContentSuggestPlatform(curPlatformAlias));
          window.searchbar?.events?.emit('q1-input', {
            value: getTextSearch(editor),
          });
          // update first result
          if (textSuggestions.length > 0) {
            setSuggestionFirstResultTimeoutId.current &&
              clearTimeout(setSuggestionFirstResultTimeoutId.current);
            setSuggestionFirstResultTimeoutId.current = setTimeout(
              updateSuggestionFirstResult,
              100,
            );
          }
        }
      } else {
        if (curPlatformAlias === 'go') {
          window.ipc.send('q1EmptyInput', { id: 'go', value: '' });
        }
        setShowTextSuggestion(false);
      }
      setCurrentPlatformIconHover('');
      editor.justSubmittedSearch = false;
    }
    // remove last tag after input
    if (
      !curInputString.startsWith(PLATFORM_CHAR) &&
      curInputString.length > prevInputString.current.length &&
      getPlatformTagAliasList(editor).length === 1
    ) {
      removeAllPlatformTag(editor);
    }
  };

  const handleChange = (value) => {
    normalizeSelection(editor);
    setInputValue(value);
    editor.lastTypedTime = new Date().getTime();
    // store 2 last selection
    editor.secondLastSelection = { ...editor.lastSelection };
    editor.lastSelection = { ...editor.selection };

    const curInputString = getInputString(editor);
    if (showPlatformSuggestion) {
      setSuggestionFocusedIndex(0);
      // if cursor out of @ range
      const { target } = getCurrentAppSearch(editor, PLATFORM_CHAR);
      const platformSuggestions = getPlatformSuggestions(editor, tabList);
      if (
        !editor.justClickedPlusSuggestion &&
        (!target || platformSuggestions.length === 0)
      ) {
        if (!target) {
          editor.isAbleToShowAppSuggestionAgain = false;
        }
        setShowPlatformSuggestion(false);
        handleInputStringChange();
      }
    } else if (showOperationSuggestion) {
      setSuggestionFocusedIndex(0);
      // if cursor out of / range
      const { target } = getCurrentAppSearch(editor, OPERATION_CHAR);
      const operationSuggestions = getOperationSuggestions(
        editor,
        operationList,
        curPlatformAlias,
        curBackgroundApp,
      );
      if (!target || operationSuggestions.length === 0) {
        if (!target) {
          editor.isAbleToShowAppSuggestionAgain = false;
        }
        setShowOperationSuggestion(false);
        handleInputStringChange();
      }
    } else {
      handleInputStringChange();
    }

    if (curInputString === '') {
      setPastSubmittedQueryFocusedIndex(-1);
    }
    editor.justSubmitedTextSuggestion = false;
    editor.justClickedPlusSuggestion = false;
    prevInputString.current = curInputString;

    if (
      !isEqualRange(prevSelection.current, editor.selection) &&
      isSelectionExpanded(editor)
    ) {
      window.updateFakeInputScrollWrapper &&
        window.updateFakeInputScrollWrapper();
    }
    prevSelection.current = editor.selection;
  };

  const showPage = (page) => {
    if (!page || currentPage === page) return;
    window.searchbar?.events?.emit('q1-requestPlaceholder', `app-page`);
    setCurrentPage(page);

    // config to make the create operation page unable to be blurred
    if (UI_CONFIGS.canOperationPageBeBlurred === false) {
      if (OPERATION_PAGES.includes(page)) {
        document.body.classList.add('operation-page');
      } else {
        document.body.classList.remove('operation-page');
      }
    }
  };
  const hidePage = () => {
    window.searchbar?.events?.emit('q1-hidePlaceholder', `app-page`);
    setCurrentPage('');
    document.body.classList.remove('operation-page');
  };

  const handleOperationItem = (item) => {
    setShowPlatformSuggestion(false);
    setShowOperationSuggestion(false);
    setShowTextSuggestion(false);
    removeOperationSearch(editor);

    if (item.page) {
      showPage(item.page);
    } else if (item.isPromptTemplate && item.alias !== curPlatformAlias) {
      setCurPlatformAlias(item.alias, 'platformBar');
      window.searchbar?.events?.emit('q1-changeTab', {
        alias: item.alias,
      });
      insertPromptTemplate(editor, item.name, true);
    } else if (item.isPromptTemplate) {
      insertPromptTemplate(editor, item.name);
    } else {
      setCurPlatformAlias('local');
      window.searchbar?.events?.emit('q1-changeTab', {
        alias: 'local',
      });
      window.ipc.send('q1App-addOperationTab', { operationId: item.id });
    }
  };

  const getAppMargin = () => {
    return isWindowMaximized ? 0 : DEFAULT_APP_MARGIN;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.ipc.send('q1App-fullFocusBack');

    const files = [...e.dataTransfer.files].map((file) => {
      return {
        name: file.name,
        path: file.path,
      };
    });

    if (curPlatformAlias === 'interpreter') {
      editor.insertText(' ' + files.map((f) => f.path).join(' '));
      return;
    }
    window.searchbar?.events?.emit('q1-submit', {
      value: '',
      files,
    });
  };

  const submitQuery = (value) => {
    const { platformAliasList, text } = parseTextSearch(value);
    if (platformAliasList.length === 0) {
      const curPlatformQueries = pastSubmittedQueries[curPlatformAlias] || [];
      const updatedCurPlatformQueries = [text, ...curPlatformQueries];
      setPastSubmittedQueries({
        ...pastSubmittedQueries,
        [curPlatformAlias]: updatedCurPlatformQueries,
      });
    } else {
      const nextPastSubmittedQueries = { ...pastSubmittedQueries };
      platformAliasList.forEach((platformAlias) => {
        const platformQueries = nextPastSubmittedQueries[platformAlias] || [];
        nextPastSubmittedQueries[platformAlias] = [text, ...platformQueries];
      });
      setPastSubmittedQueries(nextPastSubmittedQueries);
    }
    setPastSubmittedQueryFocusedIndex(-1);

    if (curPlatformAlias === 'interpreter' && /[a-zA-Z0-9-]{51}/.test(value)) {
      window.ipc.send('q1App-storeOpenAIAPIKey', value);
    }
    window.searchbar?.events?.emit('q1-submit', { value });
  };

  const moveFocusedPastSubmittedQuery = (direction) => {
    let nextIndex = pastSubmittedQueryFocusedIndex + direction;
    const curPlatformQueries = pastSubmittedQueries[curPlatformAlias] || [];
    if (curPlatformQueries.length === 0) return;
    if (nextIndex < 0) {
      return;
    } else if (nextIndex >= curPlatformQueries.length) {
      nextIndex = curPlatformQueries.length - 1;
    }
    setPastSubmittedQueryFocusedIndex(nextIndex);
    const focusedPastQuery = curPlatformQueries[nextIndex];
    replaceAllText(editor, focusedPastQuery);
  };

  return (
    <Slate
      editor={editor}
      initialValue={initialInputValue}
      onChange={handleChange}
    >
      <AppContext.Provider
        value={{
          tabList,
          operationList,
          activeOperations,
          curPlatformAlias,
          showPlatformSuggestion,
          showOperationSuggestion,
          showTextSuggestion,
          textSuggestions,
          inputValue,
          settings,
          isAlwaysOnTop,
          currentPage,
          suggestionFocusedIndex,
          currentPlatformIconHover,
          isAppJustShown,
          isUpdateNotificationShown,
          isCurPlatformLoading,
          postponeSubmitText,
          uploadFiles,
          isWindowMaximized,
          curBackgroundApp,
          setCurPlatformAlias,
          setShowPlatformSuggestion,
          setShowOperationSuggestion,
          setShowTextSuggestion,
          setTextSuggestions,
          setSettings,
          setCurrentPage,
          setSuggestionFocusedIndex,
          setCurrentPlatformIconHover,
          moveFocusedSuggestion,
          setIsAlwaysOnTop,
          setTabList,
          setOperationList,
          setActiveOperations,
          setIsAppJustShown,
          setUploadFiles,
          setIsUpdateNotificationShown,
          setIsCurPlatformLoading,
          setPostponeSubmitText,
          addNewTab,
          updateTab,
          showPage,
          hidePage,
          handleOperationItem,
          getAppMargin,
          submitQuery,
          moveFocusedPastSubmittedQuery,
        }}
      >
        <Navbar />
        <div className='pageWrapper'>
          {currentPage === '' && <div className='page' />}
          <LoadingPage />
          <CreateOperationPage />
          <SettingsPage />
          <Logo />
          <Popup />
          <NoticePopup />
          <AppOverlay />
        </div>
        <DropZone
          className='appContainer'
          id='app-container'
          onDrop={handleFileDrop}
        >
          <div className='appContainer-content'>
            <TextSuggestionList />
            <PlatformSuggestionList />
            <OperationSuggestionList />
            <AlertBar />
            <OperationBar />
            <UploadFileBar />
            <PlatformBar />
            <Input />
            <LoadingLine />
          </div>
        </DropZone>
      </AppContext.Provider>
    </Slate>
  );
}

export default App;
