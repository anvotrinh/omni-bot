export function isSameObjectAttrs(obj1, obj2) {
  if (obj1 && !obj2) return false;
  if (!obj1 && obj2) return false;
  if (!obj1 && !obj2) return true;
  return Object.keys(obj1).every((attrKey) => {
    return obj1[attrKey] === obj2[attrKey];
  });
}
