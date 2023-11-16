import React from 'react';
import './index.scss';

const TextButton = React.forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <button ref={ref} className={`textButton ${className}`} {...props}>
      {children}
    </button>
  ),
);

export default TextButton;
