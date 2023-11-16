// ==UserScript==
// @name User3
// @match https://www.bing.com/*
// @run-at document-start
// ==/UserScript==

console.log('bing.js');
document.q1_main_input_func = () => {
  let inputDOM;
  try {
    inputDOM = document
      .getElementsByTagName('cib-serp')[0]
      .shadowRoot.querySelector('cib-action-bar')
      .shadowRoot.querySelector('cib-text-input')
      .shadowRoot.getElementById('searchbox');
  } catch (e) {
    console.log(e);
  }
  return inputDOM;
};
document.q1_main_submit_button_func = () => {
  const submitButton = document
    .getElementsByTagName('cib-serp')[0]
    .shadowRoot.querySelector('cib-action-bar')
    .shadowRoot.querySelector('cib-icon-button[aria-label="Submit"]')
    .shadowRoot.querySelector('button[aria-label="Submit"]');

  if (submitButton) {
    setTimeout(() => {
      submitButton.click();
    }, 500);
  }
  return;
};

function hideInput() {
  // not used
  var cibSerp = document.getElementsByTagName('cib-serp')[0];
  if (cibSerp) {
    var style = document.createElement('style');
    style.innerHTML = `
    cib-side-panel {
      position: fixed;
      top: 50px;
      right: 0;
    }
    #cib-action-bar-main {
      align-self: center;
    }
    `;
    cibSerp.shadowRoot.appendChild(style);
    document.body.removeEventListener('DOMSubtreeModified', hideInput);
  }
}

function changeScrollbarStyle() {
  var cibSerp = document.getElementsByTagName('cib-serp')[0];
  if (!cibSerp) return;
  const cibMain = cibSerp.shadowRoot.getElementById('cib-conversation-main');
  const cibAction = cibSerp.shadowRoot.getElementById('cib-action-bar-main');

  if (!cibMain) return;

  var mainStyle = document.createElement('style');
  mainStyle.innerHTML = `
    ::-webkit-scrollbar {
      width: .5rem;
    }
    ::-webkit-scrollbar-track {
      background-color: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background-color: rgba(217, 217, 227, 0.8);
      border-color: rgba(255, 255, 255, 1);
      border-radius: 9999px;
      border-width: 1px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: rgba(236, 236, 241, 1);
    }
    
    cib-welcome-container {
      justify-content: initial !important;
    }

    .fade.bottom {
      display: none !important;
    }
    
    .content {
      padding-bottom: 0 !important;
    }
    :host(:not([mobile])) .scroller {
      justify-content: center !important;
    }
    cib-suggestion-bar {
      visibility: hidden !important;
    }
    `;
  cibMain.shadowRoot.appendChild(mainStyle);
  document.body.removeEventListener('DOMSubtreeModified', changeScrollbarStyle);

  if (cibAction) {
    const actionStyle = document.createElement('style');
    actionStyle.innerHTML = `
      .main-container {
        transition-duration: 0ms !important;
        cursor: unset !important;
        width: calc(100% - 60px) !important;
      }
      .outside-left-container {
        transition-duration: 0ms !important;
        opacity: 1 !important;
        cursor: pointer !important;
        bottom: 0 !important;
        top: unset !important;
      }
      .root .main-container {
        background: none !important;
        box-shadow: none !important;
      }
      cib-text-input {
        position: fixed;
        top: -2000px;
      }
      .bottom-right-controls {
        display: none !important;
      }
      .bottom-controls {
        margin-right: 100px;
      }
      .top-controls {
        bottom: 0 !important;
      }
      .controls-audio {
        top: unset !important;
      }
      cib-attachment-list {
        display: none !important;
      }
      cib-speech-icon {
        margin-top: 20px !important;
      }
    `;
    cibAction.shadowRoot.appendChild(actionStyle);
  }

  const cibWelcome = cibMain.shadowRoot.querySelector('cib-welcome-container');
  if (cibWelcome) {
    var welcomeStyle = document.createElement('style');
    welcomeStyle.innerHTML = `
      .header, .container-items, .footer {
        display: none !important;
      }
      .preview-container {
        display: none !important;
      }`;
    cibWelcome.shadowRoot.appendChild(welcomeStyle);
  }
}

document.body.addEventListener('DOMSubtreeModified', hideInput);
document.body.addEventListener('DOMSubtreeModified', changeScrollbarStyle);

// null as the return value of the executeJavascript, to avoid the error
null;
