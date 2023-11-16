export function isAboveFirstRowPlatform(dndEvent, listDOM) {
  if (!listDOM) return false;
  const { active, collisions } = dndEvent;
  const activeCollision = collisions.find((c) => c.id === active.id);
  if (!activeCollision) return false;
  const dom = activeCollision.data?.droppableContainer?.node?.current;
  if (!dom) return false;

  const iconWrapperDOMs = listDOM.querySelectorAll('.tabDivWrapper');
  if (iconWrapperDOMs.length === 0) return false;
  const firstLineY = iconWrapperDOMs[0].getBoundingClientRect().y;
  const { y } = dom.getBoundingClientRect();
  return y < firstLineY;
}
