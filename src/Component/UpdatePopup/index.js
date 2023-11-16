import React, { useEffect, useRef, useState } from 'react';
import './index.scss';
import LogoImage from '../../Images/UpdateIcon.png';

const UpdatePopup = () => {
  const [show, setShow] = useState(false);
  const [nextVersion, setNextVersion] = useState('');
  const wrapperDOM = useRef();

  useEffect(() => {
    window.ipc.on('q1App-autoUpdateEvent', function (e, { type, data }) {
      if (!data.isMajorUpdate) return;
      if (type === 'update-downloaded') {
        setShow(true);
        setNextVersion(data.version);
      }
    });
  }, []);

  useEffect(() => {
    if (show) {
      wrapperDOM.current.style.display = 'flex';
      window.searchbar?.events?.emit(
        'q1-requestPlaceholder',
        'show-update-popup',
      );

      setTimeout(() => {
        wrapperDOM.current.style.opacity = 1;
      }, 100);
    }
  }, [show]);

  const handleRestart = () => {
    window.ipc.send('q1App-quitAndInstall');
  };

  return (
    <div className='popupWrapper' ref={wrapperDOM}>
      <div className='popupOverlay' />
      <div className='popup'>
        <img src={LogoImage} alt='logo' />
        <div className='popup-title'>
          <span className='popup-titleVersion'>v{nextVersion} is here!</span>
          <br />
          Qute has been updated 🚀 <br />
          Please restart the app.
        </div>
        <div className='popup-button' onClick={handleRestart}>
          Restart Qute
        </div>
        <div className='popup-description'>
          Your chats will stay as they are.
        </div>
      </div>
    </div>
  );
};

export default UpdatePopup;
