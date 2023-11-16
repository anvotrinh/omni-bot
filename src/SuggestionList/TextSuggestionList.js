import { useContext, useEffect, useRef } from 'react';

import { AppContext } from '../App';
import {
  focusBlurredSelection,
  getInputString,
  getTextSearch,
  replaceAllText,
} from '../Input/utils';
import { useSlateStatic } from 'slate-react';
import { getFullSuggestionText } from '../utils/text';

const TextSuggestionList = () => {
  const {
    textSuggestions,
    suggestionFocusedIndex,
    curPlatformAlias,
    showPlatformSuggestion,
    showOperationSuggestion,
    showTextSuggestion,
    setShowTextSuggestion,
    submitQuery,
  } = useContext(AppContext);
  const editor = useSlateStatic();
  const prevShouldShow = useRef(false);

  useEffect(() => {
    window.ipc.on('q1App-suggestionClick', (e, { item, from }) => {
      if (from !== 'text') return;
      editor.justSubmitedTextSuggestion = true;
      focusBlurredSelection(editor);
      const fullSuggestionText = getFullSuggestionText(
        curPlatformAlias,
        item.name,
        getInputString(editor),
      );
      replaceAllText(editor, fullSuggestionText);
      setShowTextSuggestion(false);
      submitQuery(getTextSearch(editor));
    });
    window.ipc.on('q1App-hideAutoSuggest', () => {
      setShowTextSuggestion(false);
    });
    // eslint-disable-next-line
  }, []);

  // send render function to webviews
  useEffect(() => {
    const shouldShow =
      !showPlatformSuggestion &&
      !showOperationSuggestion &&
      showTextSuggestion &&
      textSuggestions.length > 0;
    if (!prevShouldShow.current && !shouldShow) {
      return;
    }
    prevShouldShow.current = shouldShow;

    const appContainerDOM = document.getElementById('app-container');
    window.ipc.send('q1App-setSuggestions', {
      appContainerHeight: appContainerDOM.clientHeight,
      from: 'text',
      shouldShow,
      suggestions: textSuggestions.slice(0, 10),
      focusedIndex: suggestionFocusedIndex,
    });
  }, [
    textSuggestions,
    showPlatformSuggestion,
    showOperationSuggestion,
    showTextSuggestion,
    suggestionFocusedIndex,
  ]);

  return null;
};

export default TextSuggestionList;
