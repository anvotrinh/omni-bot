// ==UserScript==
// @name User3
// @match https://poe.com/*
// @run-at document-end
// ==/UserScript==

console.log('poe.js');
document.q1_main_input_code = `document.getElementsByTagName("textarea")[0]`;
document.q1_main_submit_button_code = `
Array.from(document.querySelectorAll('footer button')).find(buttonDOM => buttonDOM.classList.value.includes('Send'))
`;

window.confirm = () => true;

// redirect
if (
  window.location.href.startsWith('https://poe.com/universal_link_page?handle=')
) {
  function checkStartButton() {
    const aDOMs = document.querySelectorAll('a[href*="login"');
    if (aDOMs.length === 0) return;
    setTimeout(() => {
      aDOMs[0].click();
    }, 25);
    document.body.removeEventListener('DOMSubtreeModified', checkStartButton);
  }
  document.body.addEventListener('DOMSubtreeModified', checkStartButton);
} else if (
  ['https://poe.com', 'https://poe.com/'].includes(window.location.href)
) {
  window.location.href = 'https://poe.com/Assistant';
}

// null as the return value of the executeJavascript, to avoid the error
null;
