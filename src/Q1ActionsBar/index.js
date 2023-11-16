import React, { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import './index.scss';
import SortableItem from './SortableItem';
import { fillIconToActions } from './utils';

const Q1ActionsBar = () => {
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
  const actionListDOM = useRef(null);
  const isDragging = useRef(false);
  const [actionList, setActionList] = useState([]);
  const [activeItemId, setActiveItemId] = useState(-1);

  useEffect(() => {
    window.ipc.send('q1View-getActionList');
    window.ipc.on('q1View-receiveActionList', (e, actionList) => {
      setActionList(fillIconToActions(actionList));
    });
    window.ipc.on('q1-screenSizeClass', () => {
      setTimeout(() => {
        if (!actionListDOM.current) return;
        window.ipc.send('q1View-updateActionsBarBounds', {
          width: actionListDOM.current.clientWidth,
          height: actionListDOM.current.clientHeight,
        });
      }, 25);
    });
  }, []);

  useEffect(() => {
    if (!actionListDOM.current) return;
    window.ipc.send('q1View-updateActionsBarBounds', {
      width: actionListDOM.current.clientWidth,
      height: actionListDOM.current.clientHeight,
    });
  }, [actionList.length]);

  const handleDragEnd = (event) => {
    isDragging.current = false;
    // change cursor
    actionListDOM.current.style.cursor = 'default';

    const { active, over } = event;
    if (!over || !active) return;
    if (active.id !== over.id) {
      setActionList((prevList) => {
        const oldIndex = prevList.findIndex((item) => item.id === active.id);
        const newIndex = prevList.findIndex((item) => item.id === over.id);
        return arrayMove(prevList, oldIndex, newIndex);
      });
    } else {
      setActiveItemId(active.id);
      window.ipc.send('q1View-actionsBarItemClick', active.id);
    }
  };

  const handleDragMove = () => {
    // change cursor
    actionListDOM.current.style.cursor = 'grabbing';
  };

  const handleDragStart = () => {
    isDragging.current = true;
  };

  if (actionList.length === 0) return null;
  return (
    <div className='actionList' ref={actionListDOM}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
      >
        <SortableContext items={actionList} strategy={rectSortingStrategy}>
          {/* <div className='actionItemList'> */}
          {actionList.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              id={item.id}
              isActive={item.id === activeItemId}
            />
          ))}
          {/* </div> */}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Q1ActionsBar;
