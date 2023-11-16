import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../App';

const SHOW_NOT_LOADING_AFTER = 6000;
const AUTO_COLLAPSE_NOT_LOADING_AFTER = 2000;
export const LOADING_MESSAGE_TYPE = 'loading';

const LoadingMessage = ({
  isAlertBarExpanded,
  setIsAlertBarExpanded,
  show,
  setMessageType,
}) => {
  const {
    postponeSubmitText,
    isCurPlatformLoading,
    setPostponeSubmitText,
    submitQuery,
  } = useContext(AppContext);
  const prevPostponeSubmitText = useRef('');
  const prevIsCurPlatformLoading = useRef(false);
  const prevShowNotLoading = useRef(false);
  const showNotLoadingTimeoutId = useRef();
  const autoCloseTimeoutId = useRef();
  const [showNotLoading, setShowNotLoading] = useState(false);

  useEffect(() => {
    if (!prevPostponeSubmitText.current && postponeSubmitText) {
      setIsAlertBarExpanded(true, LOADING_MESSAGE_TYPE);
      setMessageType(LOADING_MESSAGE_TYPE);

      // reset
      setShowNotLoading(false);
      clearTimeout(showNotLoadingTimeoutId.current);
      clearTimeout(autoCloseTimeoutId.current);
      // set timeout incase platform is not loading
      showNotLoadingTimeoutId.current = setTimeout(() => {
        setShowNotLoading(true);
      }, SHOW_NOT_LOADING_AFTER);
    }
    prevPostponeSubmitText.current = postponeSubmitText;
  }, [postponeSubmitText, setIsAlertBarExpanded, setMessageType]);

  useEffect(() => {
    // case close by platform loaded
    if (
      prevIsCurPlatformLoading.current &&
      !isCurPlatformLoading &&
      postponeSubmitText
    ) {
      setTimeout(() => {
        submitQuery(postponeSubmitText);
      }, 500);

      // if platform loaded, remove the timeout for show not loading message
      clearTimeout(showNotLoadingTimeoutId.current);
      autoCloseTimeoutId.current && clearTimeout(autoCloseTimeoutId.current);

      setPostponeSubmitText('');
      setIsAlertBarExpanded(false, LOADING_MESSAGE_TYPE);
    }
    prevIsCurPlatformLoading.current = isCurPlatformLoading;
  }, [
    isCurPlatformLoading,
    postponeSubmitText,
    setPostponeSubmitText,
    setIsAlertBarExpanded,
    submitQuery,
  ]);

  useEffect(() => {
    // case close after X time,
    if (!prevShowNotLoading.current && showNotLoading) {
      clearTimeout(autoCloseTimeoutId.current);
      autoCloseTimeoutId.current = setTimeout(() => {
        setPostponeSubmitText('');
        setIsAlertBarExpanded(false, LOADING_MESSAGE_TYPE);
      }, AUTO_COLLAPSE_NOT_LOADING_AFTER);
    }
    prevShowNotLoading.current = showNotLoading;
  }, [showNotLoading, setPostponeSubmitText, setIsAlertBarExpanded]);

  const style = {
    display: show ? 'block' : 'none',
  };
  return (
    <div className='alertBarMessage' style={style}>
      <span>
        {showNotLoading
          ? 'Platform not loading. Please check your connection'
          : 'Platform loading. Please wait a sec!'}
      </span>
    </div>
  );
};

export default LoadingMessage;
