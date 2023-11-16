import { useContext, useEffect } from 'react';
import { AppContext } from '../../App';
import { getCurrentTabId, isTabSleeping } from '../../utils/tabs';
import './index.scss';
import { UI_CONFIGS } from '../../config';

const LoadingPage = () => {
  const { curPlatformAlias, setIsCurPlatformLoading } = useContext(AppContext);

  useEffect(() => {
    setIsCurPlatformLoading(isTabSleeping(curPlatformAlias));
    window.onLoadingPageEvent = ({ tabAlias, event, isFromMain }) => {
      const { loadingTrigger: loadingTriggerConfig } = UI_CONFIGS;
      if (!loadingTriggerConfig) return;
      const startTrigger = loadingTriggerConfig['loadingPage-start'];
      const endTrigger = loadingTriggerConfig['loadingPage-end'];

      if (tabAlias !== curPlatformAlias) return;
      if (isFromMain && event === startTrigger) {
        setIsCurPlatformLoading(true);
      }
      if (isFromMain && event === endTrigger) {
        setIsCurPlatformLoading(false);
        if (getCurrentTabId() !== tabAlias) {
          window.searchbar?.events?.emit('q1-switchToTabByAlias', tabAlias);
        }
      }
    };
    // eslint-disable-next-line
  }, [curPlatformAlias]);

  return null;
};

export default LoadingPage;
