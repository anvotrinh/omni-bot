import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import Item from './Item';

const SortableItem = ({
  item,
  id,
  i,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  isVisible,
}) => {
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
      withOpacity={isDragging}
      item={item}
      i={i}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      isVisible={isVisible}
      {...attributes}
      {...listeners}
    />
  );
};

export default SortableItem;
