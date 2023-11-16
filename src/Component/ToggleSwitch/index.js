import React from 'react';
import './index.css';

const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className='toggleSwitch'>
      <input
        type='checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className='toggleSwitch-slider'></span>
    </label>
  );
};

export default ToggleSwitch;
