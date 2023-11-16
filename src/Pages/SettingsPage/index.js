import React, { useContext, useState } from 'react';
import cx from 'classnames';
import { AppContext } from '../../App';
import PageNavbar from '../../Navbar/PageNavbar';
import { isPositiveInterger } from '../../utils/text';
import { electronKeyMap } from '../../utils/keyboard';
import IconButton from '../../Component/IconButton';
import { TrashIcon } from '../../SVG';
import ToggleSwitch from '../../Component/ToggleSwitch';
import './index.scss';
import { focusBlurredSelection } from '../../Input/utils';
import { useSlateStatic } from 'slate-react';
import TextButton from '../../Component/TextButton';

export const SETTINGS_PAGE_NAME = 'settings';
const SettingsPage = () => {
  const { currentPage, settings, setSettings, hidePage } =
    useContext(AppContext);
  const editor = useSlateStatic();
  const { maxMemoryMB, showHotKey, isStartWhenPCStart, appVersion } = settings;
  const [isJustFocused, setIsJustFocused] = useState(false);

  const updateSettings = (changes) => {
    setSettings({ ...settings, ...changes });
  };

  const handleShowHotKeyDown = (e) => {
    e.preventDefault();
    setIsJustFocused(false);

    const keys = [];
    if (e.ctrlKey) {
      keys.push('Ctrl');
    }
    if (e.shiftKey) {
      keys.push('Shift');
    }
    if (e.altKey) {
      keys.push('Alt');
    }
    if (e.metaKey) {
      keys.push('Super');
    }
    if (['Control', 'Shift', 'Alt', 'Meta', 'Unidentified'].includes(e.key)) {
      keys.push('...');
    } else {
      const char = String.fromCharCode(e.keyCode);
      if (/^[A-Z0-9]$/.test(char)) {
        keys.push(char);
      } else if (electronKeyMap[e.key]) {
        keys.push(electronKeyMap[e.key]);
      } else {
        keys.push(e.key);
      }
    }
    updateSettings({ showHotKey: keys.join(' + ') });
  };

  const handleDeleteHotKey = () => {
    updateSettings({ showHotKey: 'NONE' });
  };

  const handleShowHotKeyFocus = () => {
    setIsJustFocused(true);
  };

  const handleShowHotKeyBlur = () => {
    setIsJustFocused(false);
  };

  const handleStartWhenPCStartChange = (checked) => {
    updateSettings({ isStartWhenPCStart: checked });
  };

  const saveSettings = () => {
    if (showHotKey.includes('...')) {
      alert('Please fill the hot key');
      return;
    }
    try {
      window.ipc.send('updateUserData', {
        maxMemoryMB: parseInt(maxMemoryMB),
        showHotKey: showHotKey.replace(/ \+ /g, '+'),
        isStartWhenPCStart,
      });

      focusBlurredSelection(editor);

      const settingsPageDOM = document.getElementById('settings-page');
      settingsPageDOM.style.animation = 'page-disappear 0.2s';
      setTimeout(() => {
        hidePage();
        settingsPageDOM.style.visibility = 'hidden';
      }, 180);
    } catch (e) {
      alert('Unable to parse json');
    }
  };

  const handleMaxMemoryChange = (e) => {
    const { value } = e.target;
    let nextMaxMemoryMB = value;
    // case the user click to the up/down arrow of maxmemory input
    if (isPositiveInterger(value) && isPositiveInterger(maxMemoryMB)) {
      const valueInt = parseInt(value);
      const maxMemoryInt = parseInt(maxMemoryMB);
      if (valueInt - maxMemoryInt === 1) {
        nextMaxMemoryMB = maxMemoryInt + 100;
      } else if (valueInt - maxMemoryInt === -1) {
        nextMaxMemoryMB = maxMemoryInt - 100;
      }
    }
    updateSettings({ maxMemoryMB: nextMaxMemoryMB });
  };

  if (currentPage !== SETTINGS_PAGE_NAME) return null;
  const pageContent = (
    <div className='settingsPage-content'>
      <div className='settingsPage-row'>
        <span>Hotkey to show/hide Qute</span>
        <input
          id='q1-hotkeyInput'
          className={cx({
            noneHotkey: showHotKey === 'NONE',
            hasPlaceholder: isJustFocused,
          })}
          value={isJustFocused ? 'Press hotkey' : showHotKey}
          onKeyDown={handleShowHotKeyDown}
          onFocus={handleShowHotKeyFocus}
          onBlur={handleShowHotKeyBlur}
        />
        {showHotKey !== 'NONE' && !isJustFocused && (
          <IconButton
            title='Delete Hotkey'
            className='deleteBtn'
            onClick={handleDeleteHotKey}
          >
            <TrashIcon />
          </IconButton>
        )}
        {showHotKey.includes('...') && (
          <span className='inputError'>Please fill the hot key</span>
        )}
      </div>
      <div className='settingsPage-row'>
        <span>Memory limit for app</span>
        <input
          type='number'
          min='100'
          value={maxMemoryMB}
          onChange={handleMaxMemoryChange}
        />
        <span className='settingsPage-maxMemorySuffix'>MB</span>
      </div>
      <div className='settingsPage-row'>
        <span>Auto-start on OS load</span>
        <ToggleSwitch
          checked={isStartWhenPCStart}
          onChange={handleStartWhenPCStartChange}
        />
      </div>
      <div className='settingsPage-saveClose '>
        <TextButton onClick={saveSettings}>Save and Close</TextButton>
      </div>
      <div className='settingsPage-description'>
        <p className='settingsPage-descriptionTitle'>
          Qute version {appVersion}
        </p>
        <p className='settingsPage-descriptionContent'>
          All product names and logos are property and trademarks of
          <br />
          their respective owners. © 2023, Qute. All rights reserved.
          <br />
        </p>
      </div>
    </div>
  );
  return (
    <>
      <PageNavbar back='Save & Close' title='SETTINGS' onBack={saveSettings} />
      <div className='page settingsPage' id='settings-page'>
        {pageContent}
      </div>
    </>
  );
};

export default SettingsPage;
