import React, { useEffect, useState } from 'react';
import './index.scss';

const AppOverlay = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.ipc.on('q1App-receiveRequestOverlay', function (e, data) {
      window.searchbar?.events?.emit('q1-requestPlaceholder', data);
      setShow(true);
    });
    window.ipc.on('q1App-receiveHideOverlay', function (e, data) {
      window.searchbar?.events?.emit('q1-hidePlaceholder', data);
      setShow(false);
    });
  }, []);

  if (!show) return null;
  return <div className='appOverlay'></div>;
};

export default AppOverlay;
