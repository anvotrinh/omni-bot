// ==UserScript==
// @name User3
// @match https://www.google.com/
// @run-at document-start
// ==/UserScript==

console.log('g.js');
if (window.location.href.includes('maps')) {
  document.q1_main_input_code = `
if(document.getElementsByTagName("input").length==0){
  document.getElementsByClassName("NtcBjb")[0].click();
}
document.getElementsByTagName("input")[0]`;
  //  document.q1_main_form_code = `document.getElementsByTagName("form")[0]`;
} else {
  document.q1_main_input = document.getElementsByName('q')[0];
  document.q1_main_form = document.querySelector(
    'form[action="/search"]',
  );
}

// null as the return value of the executeJavascript, to avoid the error
null;
