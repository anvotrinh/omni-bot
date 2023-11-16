# How to add a platform to QUTE

### Add platform infomation to q1Settings.json (required)

In `min-client/data/q1Settings.json`, at `platforms` attribute, add a platform object in the following format

```
{
  "url": "https://www.perplexity.ai", // url of platform
  "alias": "pe",                      // this will be used as an ID of the platform, and also be used for the platform tag in Composebox
  "name": "Perplexity",               // used in platform suggestion, and platform title in TopMenuBar
  "color": "#FC87B3",                 // color of platform tag
  "userAgent": "",                    // used when create new BrowserView
  "zoomLevel": 1,                     // zoom level, 1 equal 100%
  "state": "awake",                   // state awake, asleep, not_shown
  "isPlatform": true                  // if isPlatform is false, the platform still shows in platformBar but won't be shown in platform suggestions.
  "delayShowTime": 1000,              // when the platform changes from the asleep state to the awake state. We used the screenshot taken before the user left the platform. But some platform has an animation when loaded (That cause an inconsistent feel). To avoid this, you can set this value (ms in delay) to show the screenshot longer.
},
```

### Add platform icon (not required, if not specified QUTE will use default icon)

`src/SVG.js` Add svg content, and export it as a constant.

`utils/tabList.js` In platformIconMap constant, use the platform's alias as a key and platform icon Element as its content.

### Specify the platform behavior (depending on the platform)

In `src/config.js` file:

`export const CHAT_PLATFORMS = [...];`
If the platform alias is in this array, QUTE will remove the query after user presses submit.

`export const AUTO_CONTENT_SUGGEST_PLATFORMS = [...];`
If the platform alias is in this array, QUTE will show the content suggestion.

### Add userscripts file (required)

In `min-client/data/userscripts` directory, add a file with the following format:

```
// ==UserScript==
// @name User3
// @match https://example.com/*
// @run-at document-start
// ==/UserScript==

document.q1_main_input_func = function () {}
document.q1_main_submit_button_func = function () {}
```

1. Change @match to the new platform url. (example `// @match https://bard.google.com/*`)

2. Define `q1_main_input_func` function, which returns the main input DOM.

3. Define function to get the DOM to submit the query, use only 1 of 3 methods:

- If the platform site use <form> to submit the query, define `document.q1_main_form_func`
- Or if the platform site has submit button, then define `q1_main_submit_button_func` instead.
- Or the platform site doesn't form nor submit button, then you can ignore this. In this case, when submitting a query, QUTE will use press enter key in main input.

### Add preload file (depending on platform)

#### Preload for Auto content suggest platform

In `min-client/js/preload/default.js`,

For Autocontentsuggest platform (ex: google), to make it work, you have to specify these:

1. add the platform alias to this `AUTO_CONTENT_SUGGEST_PLATFORMS` array

`const AUTO_CONTENT_SUGGEST_PLATFORMS = ['go', 'gi', 'mp'];`

2. In `getInputValue` function, add a case to return input DOM (main input of the platform).

3. In `getSuggestion` function, add a case to return a list of content suggestions in the following format.

```
{
  name: '', // suggestion text (required)
  icon: ''  // suggestion url image (not required)
}
```

#### Preload for platform has Upload File Input

In `min-client/js/preload/default.js`,

For platform that has Upload File input (ex: claude), to make it work, you have to specify these:

1. Add the platform alias to this `INTERVAL_CHECK_UPLOAD_FILE_PLATFORMS` array

   `const INTERVAL_CHECK_UPLOAD_FILE_PLATFORMS = ['cl', 'po', 'ba', 'bi'];`

2. In `getFileInputDOM` function, add a case to return the file input DOM.
3. In `getFileUploadItems` function, add a case to return a list of uploaded file items in the following format

```
{
  dom: itemDOM,         // DOM of the upload items
  name: 'file name',
  size: '15KB',
  type: 'TXT',
  imgSrc: 'https://...' // optional, used in case the upload item is an image. name, size, and type no need to specify.
}
```

4. In `getDeleteButtonOfFileUploadItem` function, add a case to return the delete button of the file upload item (the file upload item is an element of getFileUploadItems result array).

#### Preload for changing the style of platform

This is used to hide the main input and rearrange elements on the page.

In `min-client/js/preload/style.js`, add a case to return the style string.

Note: Rule to add style, to make the style fixes stay as long as possible (since the platform site will be updated frequently)

1. Instead of generated className (ex: `x6L9br`). Try to use css selector for attributes like title, aira-label, ...

   example: `div[title="..."]`

2. If you need to select parent of main input and the parent doesn't have a unique name, try to use `:has()` selector.

   example :`div:has(> input[...])`

3. If the class name has combined with generated code (ex: `ChatBreakButton_button__EihE0`). Try to use `[class*=substring]` to query it.

   example: `button[class*=ChatBreakButton]`

### Fill input/Submit method options (depend on platform)

`min-client/main/viewManager.js`

1. In some cases, the normal `inputDOM.value = 'query'` doesn't work since the platform used javascript state behind.

   By adding platform alias to this array. After the user submit a query, QUTE will send keyboard press for each char in the query

   `const isSendEachChar = [...].includes(args.id);`

2. In some cases, the trigger enter press in main input doesn't work. (`inputDOM.dispatchEvent(new KeyboardEvent('keydown',{'keyCode':13}));`)

   By adding platform alias to this array. QUTE will send the enter press from `electron`.

   `const shouldEnterChar = ['pi'].includes(args.id);`
