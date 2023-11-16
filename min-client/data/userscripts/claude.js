// ==UserScript==
// @name User3
// @match https://claude.ai/
// @run-at document-start
// ==/UserScript==

console.log('claude.js');
document.q1_main_input_func = () => {
  let inputDOM = document.querySelector(
    'fieldset.sm\\:sticky div[contenteditable="true"]',
  );
  if (inputDOM) return inputDOM;
  inputDOM = document.querySelector(
    'fieldset.relative div[contenteditable="true"]',
  );
  return inputDOM;
};

const getSubmitButton = () => {
  let buttonDOM = document.querySelector('fieldset.sm\\:sticky button.flex');
  if (buttonDOM) return buttonDOM;
  buttonDOM = document.querySelector('fieldset.relative button.inline-flex');
  return buttonDOM;
};

document.q1_main_submit_button_func = () => {
  const menuDOM = document.querySelector('[cmdk-root]');
  setTimeout(
    () => {
      const buttonDOM = getSubmitButton();
      buttonDOM.click();
    },
    // to prevent claude UI bugs
    !!menuDOM ? 0 : 500,
  );
  return;
};

function createSVG() {
  var xmlns = 'http://www.w3.org/2000/svg';
  var boxWidth = 21;
  var boxHeight = 21;

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
    'M11.3141 9.6855H17.0247C17.4752 9.6855 17.8405 10.0507 17.8405 10.5013C17.8405 10.9518 17.4752 11.3171 17.0247 11.3171H11.3141V17.0276C11.3141 17.4781 10.9489 17.8434 10.4984 17.8434C10.0478 17.8434 9.68257 17.4781 9.68257 17.0276V11.3171H3.97204C3.52149 11.3171 3.15625 10.9518 3.15625 10.5013C3.15625 10.0507 3.52149 9.6855 3.97204 9.6855H9.68257V3.97497C9.68257 3.52442 10.0478 3.15918 10.4984 3.15918C10.9489 3.15918 11.3141 3.52442 11.3141 3.97497V9.6855Z',
  );
  path.setAttributeNS(null, 'fill', '#191918');
  g.appendChild(path);

  return svgElem;
}

function addCreateButton(parentDOM, domId) {
  if (document.getElementById(domId)) return;

  const div = document.createElement('div');
  div.id = domId;
  const svg = createSVG();
  div.appendChild(svg);

  parentDOM.appendChild(div);

  div.addEventListener('click', () => {
    window.location.href = 'https://claude.ai/chat/new';
  });
}

addCreateButton(document.body, 'q1CreateBtn-main');

function addCreateButtonToMenuPage() {
  const menuDOM = document.querySelector('[cmdk-root]');
  const mainCreateButton = document.getElementById('q1CreateBtn-main');
  if (mainCreateButton) {
    mainCreateButton.style.display = !!menuDOM ? 'none' : 'flex';
  }
  if (!menuDOM) return;

  addCreateButton(menuDOM, 'q1CreateBtn-menu');
}

document.body.addEventListener('DOMSubtreeModified', addCreateButtonToMenuPage);

// null as the return value of the executeJavascript, to avoid the error
null;
