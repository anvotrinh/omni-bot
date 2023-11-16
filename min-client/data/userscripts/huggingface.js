// ==UserScript==
// @name User3
// @match https://huggingface.co/chat/
// @run-at document-start
// ==/UserScript==

console.log('huggingface.js');
document.q1_main_input_code = `document.querySelector('textarea')`;
document.q1_main_submit_button_code = `
  document.querySelector('form.relative button[type="submit"]')
`;

function moveForm() {
  const formElement = document.querySelector('form.relative.flex.w-full');
  if (!formElement) return;
  if (formElement.style.position === 'fixed') return;
  formElement.style.position = 'fixed';
  formElement.style.top = '-2000px';
}

document.body.addEventListener('DOMSubtreeModified', moveForm);

// null as the return value of the executeJavascript, to avoid the error
null;
