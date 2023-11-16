import React, { useContext } from 'react';
import { MiniCrossIcon } from '../SVG';
import { operationInstanceIdToName } from './utils';
import { AppContext } from '../App';
import cx from 'classnames';

const OperationBarItem = ({ id, selectedId, onClick }) => {
  const { activeOperations, operationList } = useContext(AppContext);

  const handleDelete = (e) => {
    e.stopPropagation();
    window.ipc.send('q1App-removeOperationTab', {
      operationInstanceId: id,
    });
  };

  const name = operationInstanceIdToName(id, operationList, activeOperations);
  return (
    <div
      className={cx({
        operationBarItem: true,
        selected: id === selectedId,
      })}
      onClick={() => onClick(id)}
    >
      <div className='operationBarItem-name'>{name}</div>
      <div className='operationBarItem-deleteBtn' onClick={handleDelete}>
        <MiniCrossIcon />
      </div>
    </div>
  );
};

export default OperationBarItem;
