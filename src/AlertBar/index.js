import React, { useEffect, useRef, useState } from 'react';
import './index.scss';
import LoadingMessage, { LOADING_MESSAGE_TYPE } from './LoadingMessage';
import { emitLayoutResize } from '../PlatformBar';
import { getBasePlatformBarHeight } from '../utils/dom';
import UploadingMessage, { UPLOADING_MESSAGE_TYPE } from './UploadingMessage';
import FlashMessage, { FLASH_MESSAGE_TYPE } from './FlashMessage';

const AlertBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messageType, setMessageType] = useState(LOADING_MESSAGE_TYPE);
  const alertBarDOM = useRef(null);
  const fullAlertBarHeight = useRef(0);
  const requestAnimationRef = useRef(null);
  const isExpandedByTypes = useRef({});

  const animateAlertBarHeight = () => {
    const currentHeight = alertBarDOM.current.offsetHeight;

    const delta = 5;
    let nextHeight = currentHeight;
    if (isExpanded) {
      // expand
      nextHeight += delta;
      if (nextHeight >= fullAlertBarHeight.current) {
        nextHeight = fullAlertBarHeight.current;
      }
    } else {
      // close
      nextHeight -= delta;
      if (nextHeight <= fullAlertBarHeight.current) {
        nextHeight = fullAlertBarHeight.current;
      }
    }

    alertBarDOM.current.style.height = nextHeight + 'px';
    emitLayoutResize();
    requestAnimationRef.current = requestAnimationFrame(animateAlertBarHeight);
  };

  useEffect(() => {
    if (isExpanded) {
      fullAlertBarHeight.current = getBasePlatformBarHeight();
    } else {
      fullAlertBarHeight.current = 0;
    }

    cancelAnimationFrame(requestAnimationRef.current);
    requestAnimationRef.current = requestAnimationFrame(animateAlertBarHeight);
    // eslint-disable-next-line
  }, [isExpanded]);

  const handleSetIsExpanded = (isExpandedOfType, type) => {
    isExpandedByTypes.current[type] = isExpandedOfType;
    const nextIsExpanded = Object.keys(isExpandedByTypes.current).some(
      (type) => isExpandedByTypes.current[type],
    );
    setIsExpanded(nextIsExpanded);
  };
  return (
    <div className='alertBar' ref={alertBarDOM}>
      <LoadingMessage
        isAlertBarExpanded={isExpanded}
        setIsAlertBarExpanded={handleSetIsExpanded}
        show={messageType === LOADING_MESSAGE_TYPE}
        setMessageType={setMessageType}
      />
      <UploadingMessage
        isAlertBarExpanded={isExpanded}
        setIsAlertBarExpanded={handleSetIsExpanded}
        show={messageType === UPLOADING_MESSAGE_TYPE}
        setMessageType={setMessageType}
      />
      <FlashMessage
        isAlertBarExpanded={isExpanded}
        setIsAlertBarExpanded={handleSetIsExpanded}
        show={messageType === FLASH_MESSAGE_TYPE}
        setMessageType={setMessageType}
      />
    </div>
  );
};

export default AlertBar;
