import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import './index.scss';
import { UI_CONFIGS } from '../../config';

const LoadingLine = () => {
  const { curPlatformAlias } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    window.onLoadingBottomEvent = ({
      tabAlias,
      event,
      isFromMain,
      isFromChangeUrl,
    }) => {
      const { loadingTrigger: loadingTriggerConfig } = UI_CONFIGS;
      if (!loadingTriggerConfig) return;
      const startTrigger = loadingTriggerConfig['loadingBottom-start'];
      const endTrigger = loadingTriggerConfig['loadingBottom-end'];
      const startNavigationTrigger =
        loadingTriggerConfig['loadingBottom-startNavigation'];
      const endNavigationTrigger =
        loadingTriggerConfig['loadingBottom-endNavigation'];

      if (tabAlias !== curPlatformAlias) return;
      // handle main
      if (isFromMain && event === startTrigger) {
        setIsLoading(true);
      }
      if (isFromMain && event === endTrigger) {
        setIsLoading(false);
      }
      // handle link clicked
      if (isFromChangeUrl && event === startNavigationTrigger) {
        setIsLoading(true);
      }
      if (isFromChangeUrl && event === endNavigationTrigger) {
        setIsLoading(false);
      }
      // must stop if meet stop event
      if (event === 'did-stop-loading') {
        setIsLoading(false);
      }
    };
  }, [curPlatformAlias]);

  if (!isLoading) return null;

  return <div className='loadingLine' />;
};

export default LoadingLine;
