import React, { useEffect, useRef, useState } from 'react';
import './index.scss';
import Q1HelpContent from './Content';

// opacityParts [topMenuBar, Webview, PlatformBar, ComposeBox]
const defaultOpacityParts = {
  topMenuBar: 1,
  webview: 1,
  platformBar: 1,
  composeBox: 1,
};
const pageInfos = [
  {
    opacityParts: {
      topMenuBar: 1,
      webview: 1,
      platformBar: 1,
      composeBox: 1,
    },
    videoSrc: 'data/sample1.mp4',
  },
  {
    opacityParts: {
      topMenuBar: 1,
      webview: 1,
      platformBar: 1,
      composeBox: 1,
    },
    videoSrc: 'data/sample2.mp4',
  },
  {
    opacityParts: {
      topMenuBar: 1,
      webview: 1,
      platformBar: 1,
      composeBox: 1,
    },
    videoSrc: 'data/sample3.mp4',
  },
  {
    opacityParts: {
      topMenuBar: 1,
      webview: 1,
      platformBar: 1,
      composeBox: 1,
    },
    videoSrc: 'data/sample4.mp4',
  },
];

const Q1Help = () => {
  const [curPageNumber, setCurPageNumber] = useState(0);
  const [lastPageNumber, setLastPageNumber] = useState(0);
  const fadeOutTimeoutId = useRef(null);
  const shouldShowPopupOnHide = useRef(true);

  useEffect(() => {
    window.ipc.on('q1View-triggerHideHelpPage', () => {
      handleSkip();
    });
    window.ipc.on('q1View-setShowPopupHelpPage', (e, data) => {
      shouldShowPopupOnHide.current = data.shouldShowPopup || false;
    });

    document.body.style.opacity = 1;
    setCurPageNumber(1);
    // window.ipc.send('q1View-requestOverlay', 'help-popup');
  }, []);

  useEffect(() => {
    if (curPageNumber === 0) return;
    const { opacityParts } = pageInfos[curPageNumber - 1];
    window.ipc.send('q1View-changeOpacity', opacityParts);
  }, [curPageNumber]);

  const handleMouseUp = () => {
    window.ipc.send('q1-appFocusBack');
  };

  const handlePrevPage = () => {
    const prevPageNumber = curPageNumber - 1;
    if (prevPageNumber < 1) return;
    setLastPageNumber(curPageNumber);
    setCurPageNumber(prevPageNumber);
  };

  const handleNextPage = () => {
    const nextPageNumber = curPageNumber + 1;
    if (nextPageNumber > pageInfos.length) return;
    setLastPageNumber(curPageNumber);
    setCurPageNumber(nextPageNumber);
  };

  const handleSkip = () => {
    fadeOutTimeoutId.current && clearTimeout(fadeOutTimeoutId.current);

    document.body.style.opacity = 0;
    window.ipc.send('q1View-changeOpacity', defaultOpacityParts);

    fadeOutTimeoutId.current = setTimeout(() => {
      setCurPageNumber(0);
      //if (shouldShowPopupOnHide.current) {
      window.ipc.send('q1View-showPopup');
      //}
      window.ipc.send('q1View-immediateHideHelp');
      // window.ipc.send('q1View-hideOverlay', 'help-popup');
    }, 100);
  };

  if (curPageNumber === 0) return null;
  return (
    <div onMouseUp={handleMouseUp}>
      {pageInfos.map((pageInfo, i) => {
        const { videoSrc } = pageInfo;
        const pageNumber = i + 1;
        const contentProps = {
          onPrevPage: handlePrevPage,
          onNextPage: handleNextPage,
          onSkip: handleSkip,
          videoSrc,
          pageNumberText: `${pageNumber}/${pageInfos.length}`,
          isLastPage: pageNumber === pageInfos.length,
          zIndex:
            pageNumber === curPageNumber
              ? 3
              : pageNumber === lastPageNumber
              ? 2
              : 1,
        };
        return <Q1HelpContent {...contentProps} />;
      })}
    </div>
  );
};

export default Q1Help;
