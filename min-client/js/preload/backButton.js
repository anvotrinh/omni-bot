let isAddedBackButton = false;
function createSVG() {
  var xmlns = 'http://www.w3.org/2000/svg';
  var boxWidth = 24;
  var boxHeight = 24;

  var svgElem = document.createElementNS(xmlns, 'svg');
  svgElem.setAttributeNS(null, 'viewBox', '0 0 ' + boxWidth + ' ' + boxHeight);
  svgElem.setAttributeNS(null, 'width', boxWidth);
  svgElem.setAttributeNS(null, 'height', boxHeight);
  svgElem.setAttributeNS(null, 'fill', 'none');
  svgElem.style.display = 'block';

  var g = document.createElementNS(xmlns, 'g');
  svgElem.appendChild(g);

  var path = document.createElementNS(xmlns, 'path');
  path.setAttributeNS(null, 'fill-rule', 'evenodd');
  path.setAttributeNS(null, 'clip-rule', 'evenodd');
  path.setAttributeNS(
    null,
    'd',
    'M10.4142 12L14.7071 16.2929C15.0976 16.6834 15.0976 17.3166 14.7071 17.7071C14.3166 18.0976 13.6834 18.0976 13.2929 17.7071L8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929L13.2929 6.29289C13.6834 5.90237 14.3166 5.90237 14.7071 6.29289C15.0976 6.68342 15.0976 7.31658 14.7071 7.70711L10.4142 12Z',
  );
  path.setAttributeNS(null, 'fill', '#92929D');
  g.appendChild(path);

  return svgElem;
}
function addBackButton(x = 20, y = 40) {
  if (isAddedBackButton) {
    return;
  }
  isAddedBackButton = true;

  const style = document.createElement('style');
  style.id = 'q1Style';
  style.textContent = `
  .q1Back {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: ${y}px;
    left: ${x}px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background-color: #F5F5F5;
    cursor: pointer;
    z-index: 9999;
  }
  .q1Back:hover {
    background-color: #0075E4;
  }
  .q1Back:hover > svg > g > path {
    fill: white;
  }
    `;
  document.body.appendChild(style);

  const div = document.createElement('div');
  div.className = 'q1Back';
  const svg = createSVG();
  div.appendChild(svg);

  document.body.appendChild(div);

  div.addEventListener('click', () => {
    if (isCurPopupTab) {
      ipc.send('webview-destroyPopupTab', { hostTabId: curPlatformAlias });
    } else {
      window.history.back();
    }
  });
}

function initBackButton() {
  const { host } = window.location;
  if (!['accounts.google.com', 'myactivity.google.com'].includes(host)) return;
  addBackButton();
}

if (process.isMainFrame) {
  window.addEventListener('load', initBackButton);
}
