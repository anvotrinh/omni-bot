// ==UserScript==
// @name User3
// @match https://mail.google.com/*
// @run-at document-start
// ==/UserScript==

console.log('gm.js');
document.q1_main_input_code = `document.querySelector('form[role="search"] input')`;

(() => {
  const speedBumpDOM = document.getElementById('speedbump');
  if (speedBumpDOM) {
    speedBumpDOM.style.visibility = 'hidden';
  }
  const form = document.querySelector('form[role="search"]');
  // create a div to replace the space of the form. to fix loading indicator bug
  if (!form) return;
  const div = document.createElement('div');
  div.style.height = form.clientHeight + 'px';
  form.parentNode.insertBefore(div, form.nextSibling);
  // move form
  form.style.top = '-2000px';
  form.style.position = 'fixed';
})();

// null as the return value of the executeJavascript, to avoid the error
null;
