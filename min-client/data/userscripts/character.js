// ==UserScript==
// @name User3
// @match https://*.character.ai/*
// @run-at document-start
// ==/UserScript==

console.log('character.js');
document.q1_main_input_code = `document.getElementById('user-input')`;
document.q1_main_submit_button_code = `document.querySelector('button[title="Submit Message"]')`;

const headerHTML = `<div
  class="d-flex justify-content-between q1Header"
  data-darkreader-inline-border-bottom=""
>
  <div>
    <a href="/">
      <img
        class="img-fluid mt-3 mb-3"
        src="https://characterai.io/static/logo-variants/text-logo-dark.png"
        alt="logo"
        style="
          min-height: 20px;
          max-height: 32px;
          width: auto;
          max-width: 85%;
          margin-left: 14px;
        "
    /></a>
  </div>
  <div
    class="d-flex align-items-center"
    id="header-row"
    style="min-width: 175px; justify-content: flex-end"
  >
    <a class="btn" role="button" href="/search?">
      <svg
        stroke="currentColor"
        fill="currentColor"
        stroke-width="0"
        viewBox="0 0 24 24"
        height="28"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
        data-darkreader-inline-fill=""
        data-darkreader-inline-stroke=""
        style="
          --darkreader-inline-fill: currentColor;
          --darkreader-inline-stroke: currentColor;
        "
      >
        <path fill="none" d="M0 0h24v24H0z"></path>
        <path
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        ></path>
      </svg>
    </a>
    <a
      class="btn"
      href="https://book.character.ai"
      rel="noreferrer"
      target="_blank"
      ><svg
        stroke="currentColor"
        fill="currentColor"
        stroke-width="0"
        viewBox="0 0 24 24"
        height="28"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
        data-darkreader-inline-fill=""
        data-darkreader-inline-stroke=""
        style="
          --darkreader-inline-fill: currentColor;
          --darkreader-inline-stroke: currentColor;
        "
      >
        <path fill="none" d="M0 0h24v24H0z"></path>
        <path
          d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"
        ></path>
        <path
          d="M17.5 10.5c.88 0 1.73.09 2.5.26V9.24c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99zM13 12.49v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26V11.9c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.3-4.5.83zM17.5 14.33c-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26v-1.52c-.79-.16-1.64-.24-2.5-.24z"
        ></path>
      </svg>
    </a>
  </div>
</div>`;

function addHeader() {
  if (window.location.host !== 'beta.character.ai') return;
  // check if header is added
  const searchButtonDOM = document.querySelector('a[href="/search?"]');
  if (searchButtonDOM) return;

  const containerDOM = document.querySelector(
    'div.apppage > div:has(div.chattop)',
  );
  if (!containerDOM) return;

  const headerWrapper = document.createElement('div');
  headerWrapper.innerHTML = headerHTML;
  containerDOM.prepend(headerWrapper.children[0]);
}

document.body.addEventListener('DOMSubtreeModified', addHeader);

// null as the return value of the executeJavascript, to avoid the error
null;
