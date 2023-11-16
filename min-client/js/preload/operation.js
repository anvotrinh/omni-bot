if (process.isMainFrame && window.location.host === 'localhost:8000') {
  function getTabList() {
    const tabListDOM = document.querySelector('.q-tabs');
    if (!tabListDOM) return [];
    return Array.from(tabListDOM.querySelectorAll('.q-tab')).map(
      (dom) => dom.innerText,
    );
  }

  let prevTabList = [];
  function isSameList(l1, l2) {
    if (l1.length !== l2.length) return false;
    return l1.some((v, i) => v !== l2[i]);
  }
  function onChangeTabList() {
    const curTabList = getTabList();
    if (isSameList(prevTabList, curTabList)) return;
    ipc.send('q1View-onChangeActiveOperations', curTabList);
    prevTabList = curTabList;
  }

  function getTabInputDOM() {
    return document.querySelector('.q1-tabInput input');
  }
  function getAddTabButtonDOM() {
    return document.querySelector('button.q1-addTabButton');
  }
  function getRemoveTabButtonDOM() {
    return document.querySelector('button.q1-removeTabButton');
  }

  ipc.on('q1View-addOperationTab', async (e, data) => {
    const inputDOM = getTabInputDOM();
    const addButtonDOM = getAddTabButtonDOM();

    inputDOM.value = `O${data.operationId}`;
    inputDOM.dispatchEvent(
      new Event('input', { bubbles: true, cancelable: true }),
    );

    setTimeout(() => {
      addButtonDOM.click();
    });
  });

  ipc.on('q1View-removeOperationTab', (e, data) => {
    const inputDOM = getTabInputDOM();
    const removeButtonDOM = getRemoveTabButtonDOM();

    inputDOM.value = data.operationInstanceId;
    inputDOM.dispatchEvent(
      new Event('input', { bubbles: true, cancelable: true }),
    );
    setTimeout(() => {
      removeButtonDOM.click();
    });
  });

  ipc.on('q1View-switchOperationTab', (e, data) => {
    const tabListDOM = document.querySelector('.q-tabs');
    if (!tabListDOM) return [];
    const toTab = Array.from(tabListDOM.querySelectorAll('.q-tab')).find(
      (dom) => dom.innerText === data.operationInstanceId,
    );

    toTab && toTab.click();
  });

  window.addEventListener('load', () => {
    document.body.addEventListener('DOMSubtreeModified', onChangeTabList);
    ipc.send('q1View-onChangeActiveOperations', []);
  });
}
