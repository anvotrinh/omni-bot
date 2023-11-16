import React, { useEffect } from 'react';
import './index.scss';
import { getCurrentWebviewId } from '../../utils/tabs';

const ErrorPage = ({ error = {} }) => {
  useEffect(() => {
    if (!getCurrentWebviewId()) return;
    window.searchbar?.events?.emit('q1-requestPlaceholder', 'error-page');
  }, []);

  const handleRestart = () => {
    window.ipc.send('relaunchApp');
  };

  return (
    <div className='page errorPage'>
      <span>Something went wrong</span>
      {error.message && <pre>{error.message}</pre>}
      <div className='errorPage-restartBtn' onClick={handleRestart}>
        Restart Qute
      </div>
    </div>
  );
};

export const errorPageRender = ({ error, resetErrorBoundary }) => {
  console.log('Error Page', error);
  return (
    <ErrorPage error={error} />
  );
}

export default ErrorPage;
