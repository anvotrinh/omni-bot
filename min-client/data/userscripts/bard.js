// ==UserScript==
// @name User3
// @match https://bard.google.com/*
// @run-at document-start
// ==/UserScript==

console.log('bard.js');

function setInput() {
  document.q1_main_input = document.querySelector('textarea');
  if (document.q1_main_input) {
    document.q1_main_input.addEventListener('input', () => {
      document.q1_main_submit_button =
        document.querySelector('button.send-button');
    });
    document.body.removeEventListener('DOMSubtreeModified', setInput);
  }
}

document.body.addEventListener('DOMSubtreeModified', setInput);

// null as the return value of the executeJavascript, to avoid the error
null;
