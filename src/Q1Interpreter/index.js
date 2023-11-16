import React, { useEffect, useRef, useState } from 'react';
import ChromeTabs from '../utils/chrome-tabs';
import Terminal from './Terminal';
import './index.scss';
import TextInput from '../Component/TextInput';
import TextButton from '../Component/TextButton';

const Q1Interpreter = () => {
  const [terminalInfos, setTerminalInfos] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState(-1);
  const [apiKeyInput, setAPIKeyInput] = useState('');
  const [showAPIKeyInput, setShowAPIKeyInput] = useState(false);
  const chromeTabsDOM = useRef();
  const apiKeyInputDOM = useRef();
  const buttonDOM = useRef();
  const apiKeyTextInputDOM = useRef();
  const tabCounter = useRef(0);

  useEffect(() => {
    const chromeTabs = new ChromeTabs();

    chromeTabs.init(chromeTabsDOM.current, {
      tabOverlapDistance: 14,
      minWidth: 45,
      maxWidth: 243,
    });

    chromeTabsDOM.current.addEventListener('tabAdd', ({ detail }) => {
      const tabId = tabCounter.current.toString();
      chromeTabs.updateTab(detail.tabEl, {
        title: `Interpreter ${tabId}`,
        id: tabId,
      });
      setTerminalInfos((terminalInfos) => [{ id: tabId }, ...terminalInfos]);
      tabCounter.current += 1;
      window.ipc.send('q1-appFocusBack');
    });

    chromeTabsDOM.current.addEventListener('activeTabChange', ({ detail }) => {
      const { tabId } = detail.tabEl.dataset;
      setSelectedTabId(tabId);
      window.ipc.send('q1App-terminalChangeTab', { id: tabId });
    });

    chromeTabsDOM.current.addEventListener('tabRemove', ({ detail }) => {
      const { tabId } = detail.tabEl.dataset;
      setTerminalInfos((terminalInfos) =>
        terminalInfos.filter(({ id }) => id !== tabId),
      );
    });

    window.addEventListener('click', (e) => {
      let node = e.target;
      let isInInput = false;
      while (node) {
        if (!node) break;
        if ([apiKeyInputDOM.current, buttonDOM.current].includes(node)) {
          isInInput = true;
          break;
        }
        node = node.parentNode;
      }
      if (!isInInput) {
        setShowAPIKeyInput(false);
      }
    });
  }, []);

  const handleSubmitAPIKey = () => {
    window.ipc.send('q1App-storeOpenAIAPIKey', apiKeyInput);
    setShowAPIKeyInput(false);
  };

  return (
    <div className='q1Interpreter'>
      <div className='q1Interpreter-content'>
        {terminalInfos.map((terminalInfo) => (
          <Terminal
            key={terminalInfo.id}
            show={terminalInfo.id === selectedTabId}
            {...terminalInfo}
          />
        ))}
      </div>
      <div class='chrome-tabs' ref={chromeTabsDOM}>
        <div class='chrome-tabs-content'></div>
      </div>
      <TextButton
        ref={buttonDOM}
        className='showAPIKeyButton'
        onClick={() => {
          setShowAPIKeyInput(true);
          setTimeout(() => {
            apiKeyTextInputDOM.current.focus();
          }, 25);
        }}
        style={{ display: showAPIKeyInput ? 'none' : 'block' }}
      >
        Update API Key
      </TextButton>
      <div
        className='apiKeyInput'
        ref={apiKeyInputDOM}
        style={{ display: showAPIKeyInput ? 'flex' : 'none' }}
      >
        <TextInput
          value={apiKeyInput}
          ref={apiKeyTextInputDOM}
          onKeyPress={(e) => {
            if (e.code === 'Enter') {
              handleSubmitAPIKey();
            }
          }}
          onChange={(e) => setAPIKeyInput(e.target.value)}
        />
        <div className='apiKeyInput-btnGroup'>
          <TextButton onClick={() => handleSubmitAPIKey()}>Save</TextButton>
          <TextButton
            className='apiKeyInput-btnCancel'
            onClick={() => setShowAPIKeyInput(false)}
          >
            Cancel
          </TextButton>
        </div>
      </div>
    </div>
  );
};

export default Q1Interpreter;
