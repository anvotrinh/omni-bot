import { useContext, useEffect, useRef } from 'react';
import { useSlateStatic } from 'slate-react';

import { AppContext } from '../App';
import { focusBlurredSelection } from '../Input/utils';
import { getOperationSuggestions } from './utils';

const OperationSuggestionList = () => {
  const {
    curPlatformAlias,
    showPlatformSuggestion,
    showOperationSuggestion,
    suggestionFocusedIndex,
    setShowOperationSuggestion,
    handleOperationItem,
    operationList,
    curBackgroundApp,
  } = useContext(AppContext);
  const editor = useSlateStatic();
  const operationSuggestions = getOperationSuggestions(
    editor,
    operationList,
    curPlatformAlias,
    curBackgroundApp,
  );
  const prevShouldShow = useRef(false);

  useEffect(() => {
    window.ipc.on('q1App-suggestionClick', (e, { item, from }) => {
      if (from !== 'operation') return;
      focusBlurredSelection(editor);
      handleOperationItem(item);
    });
    window.ipc.on('q1App-hideAutoSuggest', () => {
      focusBlurredSelection(editor);
      setShowOperationSuggestion(false);
    });
    // eslint-disable-next-line
  }, []);

  // send render function to webviews
  useEffect(() => {
    const shouldShow =
      !showPlatformSuggestion &&
      showOperationSuggestion &&
      operationSuggestions.length > 0;
    if (!prevShouldShow.current && !shouldShow) {
      return;
    }
    prevShouldShow.current = shouldShow;

    const appContainerDOM = document.getElementById('app-container');
    window.ipc.send('q1App-setSuggestions', {
      appContainerHeight: appContainerDOM.clientHeight,
      from: 'operation',
      shouldShow,
      suggestions: operationSuggestions,
      focusedIndex: suggestionFocusedIndex,
    });
  }, [
    operationSuggestions,
    showPlatformSuggestion,
    showOperationSuggestion,
    suggestionFocusedIndex,
  ]);

  return null;
};

export default OperationSuggestionList;
