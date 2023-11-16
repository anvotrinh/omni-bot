import React from 'react';
import { PlusIcon } from '../SVG';
import { platformIconMap } from '../utils/tabList';
import { PLATFORM_CHAR } from '../App';

const SuggestionItem = ({ data, isFocused, onClick, onMouseEnter }) => {
  const { alias, icon, name, isPromptTemplate, isOperation } = data;
  return (
    <div
      className={`suggestion ${
        alias ? 'suggestion-platform' : 'suggestion-text'
      } ${isFocused ? 'focused' : ''}`}
      onClick={() => onClick(data)}
      onMouseEnter={() => onMouseEnter(data)}
    >
      <div className='suggestion-icon'>
        {alias ? (
          platformIconMap[alias]
        ) : (
          <div style={{ backgroundImage: `url('${icon}')` }} />
        )}
      </div>
      <div className='suggestion-title'>
        {alias && !isPromptTemplate && !isOperation ? PLATFORM_CHAR : ''}
        {name}
      </div>
      <div
        className='suggestion-action'
        onClick={(e) => {
          e.stopPropagation();
          onClick(data, true);
        }}
      >
        {alias && !isPromptTemplate && !isOperation && <PlusIcon />}
      </div>
    </div>
  );
};

export default SuggestionItem;
