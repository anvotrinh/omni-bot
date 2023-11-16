// ==UserScript==
// @name User3
// @match https://translate.google.com/*
// @run-at document-start
// ==/UserScript==

console.log('gt.js');
document.q1_main_input = document.getElementsByTagName('textarea')[0];
document.q1_main_form = null;

console.log(
  document.getElementsByClassName('OPPzxe')[0].getElementsByTagName('c-wiz'),
);

setInterval(function () {
  document
    .getElementsByClassName('OPPzxe')[0]
    .getElementsByTagName('c-wiz')[0].style.top = '-2000px';
  document
    .getElementsByClassName('OPPzxe')[0]
    .getElementsByTagName('c-wiz')[0].style.position = 'fixed';
}, 1000);
//document.q1_main_form.style.height = "0px";

function isInisdeLanguageButton(dom) {
  let ancestor = dom;
  while (ancestor !== null) {
    if (ancestor.attributes['data-language-code']) return true;
    ancestor = ancestor.parentNode;
  }
  return false;
}
document.body.addEventListener('click', (e) => {
  if (isInisdeLanguageButton(e.target)) {
    window.scrollTo(0, 0);
  }
});

// null as the return value of the executeJavascript, to avoid the error
null;
