import React, { useContext, useEffect, useRef } from 'react';
import cx from 'classnames';
import './index.scss';
import { AppContext } from '../../App';

const NavbarNotification = () => {
  const { currentPage, setIsUpdateNotificationShown } = useContext(AppContext);
  const wrapperDOM = useRef();

  useEffect(() => {
    window.ipc.on('q1App-autoUpdateEvent', function (e, { type, data }) {
      if (data.isMajorUpdate) return;
      if (type === 'update-downloaded') {
        wrapperDOM.current.style.display = 'flex';
        setIsUpdateNotificationShown(true);
      }
    });
    // eslint-disable-next-line
  }, []);

  const handleRestart = () => {
    window.ipc.send('q1App-quitAndInstall');
  };

  return (
    <div
      id='navbarNotification'
      className={cx({
        navbarNotification: true,
        navbarNotification_inPage: currentPage !== '',
      })}
      ref={wrapperDOM}
    >
      <span className='navbarNotification-title'>
        Qute has been updated.{' '}
        <span
          className='navbarNotification-restartText'
          onClick={handleRestart}
        >
          Restart Qute 🚀
        </span>{' '}
        to enjoy the newest version!
      </span>
    </div>
  );
};

export default NavbarNotification;
