import React, { useEffect, useRef, useState } from 'react';
import './index.scss';
import { NoticePopupCross } from '../../SVG';

const NoticePopup = () => {
  const [popupInfo, setPopupInfo] = useState(null);
  const wrapperDOM = useRef();

  useEffect(() => {
    window.ipc.on('q1App-noticePopup', function (e, data) {
      console.log('noticePopup data', data);

      const popupInfos = data.filter((p) => {
        const isSeen = localStorage.getItem(`POPUP_SEEN_${p.id}`);
        if (!isSeen) {
          localStorage.setItem(`POPUP_SEEN_${p.id}`, 'true');
        }
        return isSeen !== 'true';
      });
      if (popupInfos.length === 0) return;

      setPopupInfo(popupInfos[0]);
    });
  }, []);

  useEffect(() => {
    if (popupInfo) {
      wrapperDOM.current.style.display = 'flex';
      window.searchbar?.events?.emit(
        'q1-requestPlaceholder',
        'show-notice-popup',
      );

      setTimeout(() => {
        wrapperDOM.current.style.opacity = 1;
      }, 200);
    } else {
      wrapperDOM.current.style.opacity = 0;
      setTimeout(() => {
        wrapperDOM.current.style.display = 'none';
        window.searchbar?.events?.emit(
          'q1-hidePlaceholder',
          'show-notice-popup',
        );
      }, 250);
    }
  }, [popupInfo]);

  const handleClose = () => {
    setPopupInfo(null);
  };

  return (
    <div className='noticePopupWrapper' ref={wrapperDOM}>
      <div className='noticePopupOverlay'></div>
      {popupInfo && (
        <div
          className='noticePopup'
          style={{ width: popupInfo.width, height: popupInfo.height }}
        >
          <iframe src={popupInfo.url} title='notice popup' />
          <div className='noticePopup_closeBtn' onClick={handleClose}>
            <NoticePopupCross />
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticePopup;
