import { useContext, useEffect, useRef } from 'react';
import { useSlateStatic } from 'slate-react';

import { AppContext } from '../App';
import {
  focusBlurredSelection,
  getPlatformTagAliasList,
  insertPlatformTag,
} from '../Input/utils';
import { getPlatformSuggestions } from './utils';
import { inputScrollToTop } from '../Input';

const PlatformSuggestionList = () => {
  const {
    showPlatformSuggestion,
    suggestionFocusedIndex,
    tabList,
    setCurPlatformAlias,
    setShowPlatformSuggestion,
    setShowTextSuggestion,
  } = useContext(AppContext);
  const editor = useSlateStatic();
  const platformSuggestions = getPlatformSuggestions(editor, tabList);
  const prevShouldShow = useRef(false);

  useEffect(() => {
    window.ipc.on(
      'q1App-suggestionClick',
      (e, { item, isPlusClicked, from }) => {
        if (from !== 'platform') return;
        if (isPlusClicked) {
          editor.justClickedPlusSuggestion = true;
        }
        focusBlurredSelection(editor);
        insertPlatformTag(editor, item);
        inputScrollToTop();
        setShowTextSuggestion(false);
        // if first tag, jump to that tab
        if (getPlatformTagAliasList(editor).length === 1) {
          setCurPlatformAlias(item.alias);
          window?.searchbar?.events?.emit('q1-changeTab', {
            alias: item.alias,
          });
        }
      },
    );
    window.ipc.on('q1App-hideAutoSuggest', () => {
      focusBlurredSelection(editor);
      setShowPlatformSuggestion(false);
    });
    // eslint-disable-next-line
  }, []);

  // send render function to webviews
  useEffect(() => {
    const shouldShow = showPlatformSuggestion && platformSuggestions.length > 0;
    if (!prevShouldShow.current && !shouldShow) {
      return;
    }
    prevShouldShow.current = shouldShow;

    const appContainerDOM = document.getElementById('app-container');
    window.ipc.send('q1App-setSuggestions', {
      appContainerHeight: appContainerDOM.clientHeight,
      from: 'platform',
      shouldShow,
      suggestions: platformSuggestions.map((s) => ({
        ...s,
        icon: null,
      })),
      focusedIndex: suggestionFocusedIndex,
    });
  }, [platformSuggestions, showPlatformSuggestion, suggestionFocusedIndex]);

  return null;
};

export default PlatformSuggestionList;
