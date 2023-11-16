import React, { useEffect, useState } from 'react';
import './index.scss';
import SuggestionItem from './SuggestionItem';

const Q1Autosuggest = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(true);
  const [from, setFrom] = useState('');

  useEffect(() => {
    window.ipc.on('q1View-setSuggestions', (e, data) => {
      setSuggestions(data.suggestions);
      setFocusedIndex(data.focusedIndex);
      setFrom(data.from);
    });
  }, []);

  const handleItemClick = (item, isPlusClicked) => {
    window.ipc.send('q1View-suggestionClick', {
      item,
      isPlusClicked,
      from,
    });
  };

  const handleOverlayClick = () => {
    window.ipc.send('q1View-overlayClick');
  };

  const handleItemMouseEnter = (item) => {
    const focusedIndex = suggestions.findIndex((s) => s.name === item.name);
    if (focusedIndex === -1) return;
    window.ipc.send('q1View-setFocusedIndex', { focusedIndex });
  };

  return (
    <div className='suggestionContainer'>
      <div className='suggestionOverlay' onClick={handleOverlayClick} />
      <div className='suggestionList'>
        {suggestions.map((suggestion, i) => (
          <SuggestionItem
            key={i}
            data={suggestion}
            onClick={handleItemClick}
            onMouseEnter={handleItemMouseEnter}
            isFocused={focusedIndex === i}
          />
        ))}
      </div>
    </div>
  );
};

export default Q1Autosuggest;
