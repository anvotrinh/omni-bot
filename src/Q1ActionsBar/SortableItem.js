import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import Item from './Item';

const SortableItem = ({ item, id, isActive }) => {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    position: 'relative',
  };

  return (
    <Item
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      isActive={isActive}
      item={item}
      {...attributes}
      {...listeners}
    />
  );
};

export default SortableItem;
