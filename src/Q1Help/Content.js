import React, { useEffect, useRef } from 'react';
import Video from '../Component/Video';
import { LeftArrowIcon, RightArrowIcon } from '../SVG';

const Q1HelpContent = ({
  videoSrc,
  onPrevPage,
  onNextPage,
  onSkip,
  pageNumberText,
  isLastPage,
  zIndex,
}) => {
  const containerRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    if (zIndex === 3) {
      videoRef.current.replay();
      containerRef.current.style.opacity = 1;

      window.ipc.send('q1View-updateHelpBounds', {
        height: containerRef.current.clientHeight,
      });
    } else {
      videoRef.current.pause();
      containerRef.current.style.opacity = 0;
    }
  }, [zIndex]);

  const handleResize = () => {
    if (zIndex !== 3) return;
    window.ipc.send('q1View-updateHelpBounds', {
      height: containerRef.current.clientHeight,
    });
  };

  return (
    <div
      ref={containerRef}
      className='q1HelpContainer'
      style={{ zIndex }}
      onResize={handleResize}
    >
      <Video className='q1HelpVideo' ref={videoRef} src={videoSrc} />
      <div className='q1HelpPageController'>
        <div onClick={onPrevPage}>
          <LeftArrowIcon />
        </div>
        <span>{pageNumberText}</span>
        <div
          onClick={onNextPage}
          style={{ visibility: isLastPage ? 'hidden' : 'visible' }}
        >
          <RightArrowIcon />
        </div>
      </div>
      <div
        className={`q1HelpPageSkip ${isLastPage ? 'q1HelpPageSkip-last' : ''}`}
        onClick={onSkip}
      >
        <span>{isLastPage ? 'Get started!' : 'Skip this tutorial'}</span>
      </div>
    </div>
  );
};

export default Q1HelpContent;
