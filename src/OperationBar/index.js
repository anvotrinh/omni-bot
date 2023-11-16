import React, { useContext, useRef, useState } from 'react';
import { useEffect } from 'react';

import './index.scss';
import { AppContext } from '../App';
import OperationBarItem from './Item';

const OperationBar = () => {
  const { activeOperations, setActiveOperations, curPlatformAlias } =
    useContext(AppContext);
  const prevTotalActiveOperations = useRef(0);
  const [selectedItem, setSelectedItem] = useState('');

  useEffect(() => {
    window.onChangeActiveOperations = (data) => {
      setActiveOperations(data);
    };
  }, [setActiveOperations]);

  useEffect(() => {
    // add tab case
    if (activeOperations.length > prevTotalActiveOperations.current) {
      const newAddedId = activeOperations[activeOperations.length - 1];
      setSelectedItem(newAddedId);
      window.ipc.send('q1App-switchOperationTab', {
        operationInstanceId: newAddedId,
      });
    }
    prevTotalActiveOperations.current = activeOperations.length;
  }, [activeOperations]);

  const handleItemClick = (id) => {
    setSelectedItem(id);
    window.ipc.send('q1App-switchOperationTab', {
      operationInstanceId: id,
    });
  };

  const style = {
    display: activeOperations.length === 0 ? 'none' : 'flex',
  };
  if (curPlatformAlias !== 'local') return null;
  return (
    <div className='operationBar' style={style}>
      {activeOperations.map((item) => (
        <OperationBarItem
          key={item}
          id={item}
          selectedId={selectedItem}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
};

export default OperationBar;
