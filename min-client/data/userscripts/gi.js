// ==UserScript==
// @name User3
// @match https://images.google.com/*
// @run-at document-start
// ==/UserScript==

console.log('gi.js');
document.q1_main_input = document.getElementsByName('q')[0];
if (document.getElementById('tsf'))
  document.q1_main_form = document.getElementById('tsf');
else document.q1_main_form = document.getElementById('sf');

// null as the return value of the executeJavascript, to avoid the error
null;
