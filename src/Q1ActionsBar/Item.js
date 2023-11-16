import React from 'react';

const Item = React.forwardRef(
  ({ item, isDragging, isActive, style, ...props }, ref) => {
    const inlineStyles = {
      opacity: isDragging ? '0.7' : '1',
      ...style,
    };

    return (
      <div
        ref={ref}
        className='actionItemWrapper'
        style={inlineStyles}
        {...props}
      >
        <div className={`actionItem ${isActive ? 'active' : ''}`}>
          {item.icon}
        </div>
      </div>
    );
  },
);

export default Item;
