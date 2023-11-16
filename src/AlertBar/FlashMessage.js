import React, { useEffect, useRef, useState } from 'react';

const AUTO_COLLAPSE_AFTER = 2000;
export const FLASH_MESSAGE_TYPE = 'flash';

const FlashMessage = ({
  isAlertBarExpanded,
  setIsAlertBarExpanded,
  show,
  setMessageType,
}) => {
  const [message, setMessage] = useState('');
  const autoCloseTimeoutId = useRef();

  useEffect(() => {
    window.showAlertBarFlashMessage = (message) => {
      if (!message) return;
      setIsAlertBarExpanded(true, FLASH_MESSAGE_TYPE);
      setMessage(message);
      setMessageType(FLASH_MESSAGE_TYPE);

      clearTimeout(autoCloseTimeoutId.current);
      autoCloseTimeoutId.current = setTimeout(() => {
        setIsAlertBarExpanded(false, FLASH_MESSAGE_TYPE);
      }, AUTO_COLLAPSE_AFTER);
    };
    // eslint-disable-next-line
  }, []);

  const style = {
    display: show ? 'block' : 'none',
  };
  return (
    <div className='alertBarMessage' style={style}>
      <span>{message}</span>
    </div>
  );
};

export default FlashMessage;
