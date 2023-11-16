import React from 'react';
import './index.scss';

const IconButton = React.forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <button ref={ref} className={`iconButton ${className}`} {...props}>
      {children}
    </button>
  ),
);

export default IconButton;
