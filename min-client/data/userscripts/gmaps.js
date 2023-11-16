// ==UserScript==
// @name User3
// @match https://www.google.com/maps/*
// @run-at document-start
// ==/UserScript==

console.log('gmap.js');

document.q1_main_input_code = `
if(document.getElementsByTagName("input").length==0){
  document.getElementsByClassName("NtcBjb")[0].click();
}
document.getElementsByTagName("input")[0]`;
document.q1_main_form_code = `document.getElementsByTagName("form")[0]`;

// null as the return value of the executeJavascript, to avoid the error
null;
