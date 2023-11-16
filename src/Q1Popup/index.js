import React, { useEffect } from 'react';
import './index.scss';
import popupIcon from '../Images/PopupIcon.png';

const Q1Popup = () => {
  useEffect(() => {
    document.body.style.opacity = 1;
    setTimeout(() => {
      document.body.style.opacity = 0;
    }, 2500);
    setTimeout(() => {
      window.ipc.send('q1View-immediateHidePopup');
    }, 3000);
  }, []);

  return (
    <>
      <div className='q1Popup-shadow'></div>
      <div className='q1Popup'>
        <img src={popupIcon} alt='popup icon' />
        <span>
          You can reopen the Help from
          <br /> the Menu bar here. Have fun!
        </span>
        <div className='q1PopupCaret'></div>
      </div>
    </>
  );
};

export default Q1Popup;
