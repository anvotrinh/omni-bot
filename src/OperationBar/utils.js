// operationInstanceId: O1-0
const getOperationInstanceInfo = (id) => {
  const [operationIdWithPrefix, instanceIndex] = id.split('-');
  const operationId = parseInt(operationIdWithPrefix.substring(1));
  return {
    operationId,
    instanceIndex,
  };
};

export const operationInstanceIdToName = (
  id,
  operationList,
  activeOperations,
) => {
  const { operationId: curOperationId, instanceIndex: curInstanceIndex } =
    getOperationInstanceInfo(id);
  const curOperationName = (
    operationList.find((o) => o.id === curOperationId) || {}
  ).name;
  let instanceCount = 0;
  activeOperations.forEach((aId) => {
    const { operationId: aOperationId, instanceIndex: aInstanceIndex } =
      getOperationInstanceInfo(aId);
    if (aOperationId !== curOperationId) return;
    if (curInstanceIndex >= aInstanceIndex) {
      instanceCount++;
    }
  });
  return `${curOperationName} ${instanceCount}`;
};
