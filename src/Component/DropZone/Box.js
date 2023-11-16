import React from 'react';

const DropZoneBox = ({ show, onDragLeave }) => {
  if (!show) return null;

  return (
    <div className='dropZoneBox' onDragLeave={onDragLeave}>
      <div className='dropZoneBox-content'>
        <span className='dropZoneBox-text'>Drop your file</span>
      </div>
    </div>
  );
};

export default DropZoneBox;
