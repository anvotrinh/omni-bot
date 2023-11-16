// ==UserScript==
// @name User3
// @match https://chat.openai.com/*
// @run-at document-start
// ==/UserScript==

console.log('oa.js');
document.q1_main_input_code = `document.getElementsByTagName('textarea')[0];`;
let checkDisabledIntervalId;
document.q1_main_submit_button_func = () => {
  const submitDOM = document.querySelector('form button.absolute.p-1');
  if (!submitDOM.disabled) {
    submitDOM.click();
    return;
  }
  checkDisabledIntervalId && clearInterval(checkDisabledIntervalId);
  checkDisabledIntervalId = setInterval(() => {
    if (submitDOM.disabled) return;
    submitDOM.click();
    clearInterval(checkDisabledIntervalId);
  }, 10);
  return;
};

function handleMouseDown(e) {
  if (e.offsetX > e.target.clientWidth) {
    intervalId && clearInterval(intervalId);
    intervalId = null;
  }
}

let buttonDOM;
let scrollDOM;
let intervalId;
function startInterval() {
  intervalId && clearInterval(intervalId);
  intervalId = setInterval(() => {
    scrollDOM.scrollBy(0, 10000);
  }, 300);
}
// remove input when user change tab
document.body.addEventListener('DOMSubtreeModified', function () {
  buttonDOM = document.querySelector('form button');
  scrollDOM = document.querySelector(
    '[class*=react-scroll-to-bottom]:has(> div.flex.flex-col)',
  );
  buttonDOM && buttonDOM.addEventListener('click', startInterval);
  scrollDOM && scrollDOM.addEventListener('mousedown', handleMouseDown);
});

window.addEventListener('wheel', (event) => {
  if (event.deltaY < 0) {
    intervalId && clearInterval(intervalId);
    intervalId = null;
    return;
  }
  if (!scrollDOM || intervalId) return;

  // start the interval again if it reach the bottom
  const currentScrollEnd = scrollDOM.scrollTop + scrollDOM.clientHeight;
  if (scrollDOM.scrollHeight - currentScrollEnd <= 70) {
    startInterval();
  }
});

if (window.location.href === 'https://chat.openai.com/auth/login') {
  function checkLoginButton() {
    const buttonDOMs = document.querySelectorAll('button');
    if (buttonDOMs.length === 0) return;
    setTimeout(() => {
      buttonDOMs[0].click();
    }, 25);
    document.body.removeEventListener('DOMSubtreeModified', checkLoginButton);
  }
  document.body.addEventListener('DOMSubtreeModified', checkLoginButton);
}

// null as the return value of the executeJavascript, to avoid the error
null;
