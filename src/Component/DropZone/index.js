import React, { useState } from 'react';
import './index.scss';
import DropZoneBox from './Box';

const DropZone = ({ children, onDrop, ...props }) => {
  const [showDropZone, setShowDropZone] = useState(false);

  return (
    <div
      {...props}
      onDrop={(e) => {
        setShowDropZone(false);
        onDrop(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={() => setShowDropZone(true)}
    >
      <DropZoneBox
        show={showDropZone}
        onDragLeave={() => {
          setShowDropZone(false);
        }}
      />
      {children}
    </div>
  );
};

export default DropZone;
