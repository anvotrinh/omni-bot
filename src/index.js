import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App';
import Q1Help from './Q1Help';
import Q1Autosuggest from './Q1Autosuggest';
import Q1Popup from './Q1Popup';
import { errorPageRender } from './Pages/ErrorPage';
import Q1Interpreter from './Q1Interpreter';
import Q1ActionsBar from './Q1ActionsBar';

const loadApp = () => {
  const rootDOM = document.getElementById('react-root');
  const mode = rootDOM.dataset.mode;
  const root = ReactDOM.createRoot(rootDOM);
  root.render(
    <React.StrictMode>
      {mode === 'help' && <Q1Help />}
      {mode === 'app' && (
        <ErrorBoundary fallbackRender={errorPageRender}>
          <App />
        </ErrorBoundary>
      )}
      {mode === 'autosuggest' && <Q1Autosuggest />}
      {mode === 'popup' && <Q1Popup />}
      {mode === 'actionsBar' && <Q1ActionsBar />}
      {mode === 'interpreter' && <Q1Interpreter />}
    </React.StrictMode>,
  );
};

document.addEventListener('DOMContentLoaded', function () {
  loadApp();
});
