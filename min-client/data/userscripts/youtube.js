// ==UserScript==
// @name User3
// @match https://*.youtube.com/*
// @run-at document-end
// ==/UserScript==

console.log('youtube.js');
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const ss = async () => {
  await delay(2000);
};

document.q1_main_input_code = `
  if(document.getElementById("masthead").getAttribute("show-input") == null){
    document.getElementById("search-button-narrow").click();
    ss();
  }
  document.querySelector("input#search")
`;

document.q1_main_form_code = `
  document.getElementById("search-form")
`;

// null as the return value of the executeJavascript, to avoid the error
null;
