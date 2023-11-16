import React, { useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';

export const UPLOADING_MESSAGE_TYPE = 'uploading';

const UploadingMessage = ({
  isAlertBarExpanded,
  setIsAlertBarExpanded,
  show,
  setMessageType,
}) => {
  const { curPlatformAlias } = useContext(AppContext);
  const isPageUploading = useRef(false);
  const isItemUploading = useRef(false);

  useEffect(() => {
    const toggleAlertBar = () => {
      if (isPageUploading.current || isItemUploading.current) {
        setIsAlertBarExpanded(true, UPLOADING_MESSAGE_TYPE);
        setMessageType(UPLOADING_MESSAGE_TYPE);
      } else {
        setIsAlertBarExpanded(false, UPLOADING_MESSAGE_TYPE);
      }
    };
    window.onChangeIsUploading = (data) => {
      if (curPlatformAlias !== data.id) return;
      isPageUploading.current = data.isUploading;
      toggleAlertBar();
    };
    window.onChangeUploadFile_2 = (data) => {
      if (curPlatformAlias !== data.id) return;
      isItemUploading.current = data.items.some((item) => item.isLoading);
      toggleAlertBar();
    };
  }, [curPlatformAlias, setIsAlertBarExpanded, setMessageType]);

  const style = {
    display: show ? 'block' : 'none',
  };
  return (
    <div className='alertBarMessage' style={style}>
      <span>Uploading...</span>
    </div>
  );
};

export default UploadingMessage;
