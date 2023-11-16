// ==UserScript==
// @name User3
// @match https://www.perplexity.ai/
// @run-at document-start
// ==/UserScript==

console.log('perplexity.js');
document.q1_main_input_code = `document.querySelector('textarea')`;
document.q1_main_submit_button_code = `
  inputElement = document.querySelector('textarea')
  inputElement.parentElement.parentElement.querySelector('button:has(svg[class*=fa-arrow-right])')
`;

function handleSubmit() {
  const inputElement = document.querySelector('textarea');
  if (inputElement.getAttribute('placeholder') === 'Ask follow-up...') return;
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    document.body.style.overflow = 'auto';
  }, 1000);
}

function moveInput() {
  const inputElement = document.querySelector('textarea');
  if (!inputElement) return;
  if (inputElement.parentElement.tagName.toLowerCase() === 'body') return;

  if (inputElement.style.position !== 'fixed') {
    inputElement.style.position = 'fixed';
    inputElement.style.top = '-2000px';
  }

  if (inputElement.parentElement.style.position !== 'fixed') {
    const isLoggedIn = !document.querySelector(
      'button.bg-offsetPlus.dark\\:bg-offsetPlusDark.text-textMain',
    );

    inputElement.parentElement.style.position = 'fixed';
    inputElement.parentElement.style.bottom = isLoggedIn ? '63px' : '60px';

    if (inputElement.getAttribute('placeholder') === 'Ask follow-up...') {
      const wrapperResult = inputElement.parentElement.querySelector(
        '.bg-green.absolute.flex.bg-background',
      );
      wrapperResult.style.width = '100%';
      wrapperResult.style.justifyContent = 'space-between';
      wrapperResult.style.marginBottom = '40px';
      wrapperResult.style.paddingTop = '7px';
      wrapperResult.style.paddingBottom = '20px';

      inputElement.parentElement.style.bottom = '63px';
    }
  }

  const submitButton = inputElement.parentElement.parentElement.querySelector(
    'button:has(svg[class*=fa-arrow-right])',
  );
  submitButton.addEventListener('click', handleSubmit);
}

moveInput();
document.body.addEventListener('DOMSubtreeModified', moveInput);

// null as the return value of the executeJavascript, to avoid the error
null;
