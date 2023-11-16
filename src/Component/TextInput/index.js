import React from 'react';
import './index.scss';

const TextInput = React.forwardRef(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`textInput ${className}`} {...props} />
));

export default TextInput;
