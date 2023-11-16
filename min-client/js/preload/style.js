console.log('webview_preload.js');

const defaultStyle = ``;

const googleSearch = `
.zGVn2e, .RNNXgb {
  top : -2000px;
  position: fixed;
  }
.CKtgbd, .Gwkg9c {
  top : -2000px;
  position: fixed;
  }
.qbOKL {
  left: 0;
  right: 0;
}
.Sl6fgd {
  top : -2000px !important;
}
agsa-home-screen-icon-banner {
  display: none;
}
#SBmmZd,
#belowsb,
#SIvCob,
.BDGSxf,
.FPdoLc,
.UUbT9,
#footer,
.fbar.M6hT6 {
  display: none !important;
}
@media only screen and (min-width: 768px) {
  #main, #rcnt {
    display: flex;
    justify-content: center;
  }
  #center_col, .M8OgIe {
    margin-left: 0 !important;
  }
  .sBbkle, #appbar {
    padding-left: 0 !important;
  }
}
`;

const googleTranslate = `
.OPPzxe c-wiz:first-of-type {
  top : -2000px;
  position: fixed;
}`;

const googleImage = `
.FtRlBe{
  top : -2000px;
  position: fixed;
}
.jhFIre{
  top : -2000px !important;
  position: fixed !important;
}
`;

const googleMap = `
.vk8Ryd {
  top : -2000px;
  position: fixed;
}
.BIg4wb{
  top : -2000px;
  position: fixed;
}
.iUBJCc {
  top : -2000px;
  position: fixed;
}
.GnJVlc {
top : -2000px;
position: fixed;
}
.map-extent{
   position: fixed;
}
`;

const youtube = `
.topbar-menu-button-avatar-button{
  display: none;
}
.search-bar{
  display: none;
}
.sbdd_b{
  display: none;
}
#center.ytd-masthead {
  top : -2000px;
  position: fixed;
}
#search-button-narrow{
  top : -2000px;
  position: fixed;
}
#search-icon-legacy{
  top : -2000px;
  position: fixed;
}`;

const poe = `
body {
  user-select: text !important;
}
footer:not(:has(div[class*=ChatPageDeleteFooter])) {
  position: fixed !important;
  top: 2000px;
  left: -2000px;
}
footer button[class*=ChatBreakButton] {
  position: fixed;
  bottom: 0;
  left: 30px;
  background-color: white;
}
footer button[class*=ChatMessageFileInputButton] {
  position: fixed;
  bottom: 6px;
  right: 30px;
  background-color: white;
}
footer button[class*=ChatMessageVoiceInputButton] {
  position: fixed;
  bottom: 6px;
  right: 80px;
  background-color: white;
}
header[class*=navbar]::after {
  content: 'Choose Bot';
  position: absolute;
  top: 12px;
  left: 56px;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  color: #242424;
}
@media only screen and (min-width: 1280px) {
  div[class*=MainColumn_scrollSection] {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
  }
}
`;

const bard = `
input-area {
  position: fixed;
  top : -2000px;
}
uploader {
  position: fixed;
  bottom: 10px;
}
uploader button {
  border-radius: 8px !important;
}
uploader button mat-icon {
  position: relative;
}
uploader button mat-icon::after {
  content: "";
  position: absolute;
  top: 2px;
  bottom: 3px;
  left: 2px;
  right: 2px;
  border-radius: 50%;
  z-index: -1;
  background-color: white;
}
@media only screen and (min-width: 768px) {
  uploader {
    bottom: 23px;
  }
}
`;

const character = `
a[href="/help?"] {
  display: none;
}
.swiper-button-next::before, .swiper-button-prev::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  border: 1px solid white;
  border-radius: 50%;
  filter: brightness(10);
}
form.chatform {
  position: fixed;
  top: -2000px;
}
.q1Header {
  border-bottom: 1px solid rgba(238, 238, 238, 0.5);
  --darkreader-inline-border-bottom: rgba(63, 65, 65, 0.5);
  z-index: 99;
}
.chattop {
  position: relative !important;
}
div.apppage > div:has(.chattop) > div[class*="react-scroll-to-bottom"] {
  margin-top: 55px !important;
}
div.apppage > div:has(.chattop) > div[data-darkreader-inline-bgimage] {
  top: 70px !important;
} `;

const chatGPT = `
.px-3.pb-3.pt-2.text-center.text-xs,
.cursor-pointer.absolute.right-6.rounded-full {
  display: none;
}
.absolute.bottom-0.left-0.w-full {
  border-top: none !important;
}
.pb-3.pt-2.text-center.text-xs.text-gray-600.dark\\:text-gray-300.md\\:pb-6.md\\:pt-3 {
  display: none;
}
form button.absolute.p-1.rounded-md, form textarea {
  position: fixed !important;
  top: -2000px !important;
  bottom: unset !important;
  height: 50px !important;
}
form .flex.flex-col.w-full {
  box-shadow: none !important;
  border: none !important;
}
form .flex.flex-col.w-full > div.flex.flex-wrap {
  margin-bottom: 36px !important;
}
form .flex.items-center.md\\:items-end button {
  position: fixed;
  bottom: 16px;
  right: 16px;
}
form .absolute.bottom-full.left-0.flex.w-full.grow {
  display: none !important;
}
button[id*=headlessui-menu-button].invisible.rounded-full {
  display: none;
}
@media only screen and (min-width: 768px) {
  div.relative.flex.h-full.max-w-full:has(> div > main) {
    position: fixed;
    left: 0;
    right: 0;
    z-index: -1;
  }
}
body.sh-mini #__next {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
}
body.sh-mini div:has(> main) > .sticky {
  display: none;
}
div:has(> form) > .relative {
  display: none;
}
`;
// body:has(.px-2.w-full.flex.flex-col.py-2.md\\:py-6.sticky.top-0) .text-gray-800.w-full.mx-auto.md\\:flex::after {
//   content: 'Type a query to get started';
//   position: fixed;
//   top: 70%;
//   left: 0;
//   width: 100%;
//   color: #EAEAEA;
//   font-size: 30px;
//   font-weight: 500;
//   text-align: center;
// }

const huggingFace = `
.mt-2.flex.justify-between.self-stretch {
  display: none !important;
}
.lg\\:col-span-3.lg\\:mt-12 {
  visibility: hidden;
}
.lg\\:col-span-1 p.text-base.text-gray-600.dark\\:text-gray-400 {
  display: none !important;
}
.my-auto.grid.gap-8.lg\\:grid-cols-3 {
  gap: 0 !important;
}
a.mr-2.flex.items-center.underline.hover\\:no-underline {
  display: none !important;
}
@media only screen and (min-width: 768px) {
  #app > div.grid {
    display: flex !important;
  }
  #app > div.grid > div.relative.min-h-0.min-w-0 {
    width: 100% !important;
  }
  #app > div > nav.grid:not(.fixed) {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 280px;
    z-index: 1;
  }
}
`;

const heypi = `
.w-full.mx-auto:has(> div > div > textarea) {
  position: fixed;
  top: -2000px;
}
.w-full.mx-auto:has(> div > div > textarea) button {
  position: fixed !important;
  right: 15px !important;
  bottom: 5px !important;
}
div:has(> button.mr-2.grid.h-9.w-9) {
  transform: unset !important;
}
button.mr-2.grid.h-9.w-9 {
  position: fixed !important;
  left: 15px !important;
  bottom: 15px !important;
}
`;

const bing = `
body {
  min-width: auto !important;
  overflow: hidden;
}
.b_scopebar {
  display: none;
}
#id_h {
  position: fixed !important;
  right: 0 !important;
  top: 18px !important;
}
#b_sydWelcomeTemplate {
  display: none;
}
#b_sydBgCover {
  display: none !important;
}
#b_sydConvCont {
  transform: translateY(0) !important;
  transition-delay: 0s !important;
  opacity: 1 !important;
  visibility: visible !important;
  transition-duration: 0s !important;
}
#b_content, form[action="/search"] > div.b_searchboxForm {
  display: none !important;
}
body:not(.b_sydConvMode) header, body:not(.b_sydConvMode) footer, [data-viewname="ChatPersistentFlyout"] {
  display: none !important;
}
body:not(.b_sydConvMode)::after {
  content: '';
  background: var(--cib-color-fill-accent-gradient-quaternary);
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
`;

const perplexity = `
.flex.gap-xs.items-center.mt-sm.flex-wrap {
  display: none;
}
.mt-sm.divide-borderMain.bg-transparent {
  display: none;
}
.z-10.border-t.bottom-0 {
  border: none !important;
}
.md\\:hidden.py-sm.px-sm {
  display: none;
}
.bg-super.text-white.font-sans.outline-none.rounded-full.inline-flex {
  position: fixed;
  top: -2000px;
}
.text-3xl.md\\:text-4xl.font-medium {
  display: none;
}
div.bg-white.focus\\:bg-white.dark\\:bg-offsetDark {
  padding: 0 !important;
  margin: 0 !important;
}
.grow.md\\:rounded-3xl.shadow-sm.md\\:dark\\:border {
  margin: 0 !important;
}
.mb-lg.md\\:mb-xl.w-full .mt-lg {
  display: none;
}
.z-10.border-t.md\\:border-none.left-0.right-0.fixed {
  border-top: none !important;
}
.bg-green.absolute.flex.bg-background {
  background-color: unset !important;
}
.bg-green.absolute.flex.bg-background > button {
  background-color: rgb(252 252 249/var(--tw-bg-opacity)) !important;
}
body:has(a[href="/"] .h-auto.w-6.md\\:w-8):not(:has(.md\\:hidden.bottom-0.fixed.left-0.right-0.bg-offset)) div:has(> textarea) {
  bottom: 0 !important;
}
body:has(a[href="/"] .h-auto.w-6.md\\:w-8):not(:has(.md\\:hidden.bottom-0.fixed.left-0.right-0.bg-offset)) .z-10.border-t.md\\:border-none.left-0.right-0.fixed {
  display: flex !important;
}
body:has(a[href="/"] .h-auto.w-6.md\\:w-8):not(:has(.md\\:hidden.bottom-0.fixed.left-0.right-0.bg-offset)) .z-10.border-t.md\\:border-none.left-0.right-0.fixed > div.md\\:hidden {
  width: 50% !important;
}
body:has(a[href="/"] .h-auto.w-6.md\\:w-8):not(:has(.md\\:hidden.bottom-0.fixed.left-0.right-0.bg-offset)) .z-10.border-t.md\\:border-none.left-0.right-0.fixed > div.w-full {
  position: fixed !important;
}
body:has(a[href="/"] .h-auto.w-6.md\\:w-8):not(:has(.md\\:hidden.bottom-0.fixed.left-0.right-0.bg-offset)) .z-10.border-t.md\\:border-none.left-0.right-0.fixed > div.md\\:hidden > div.flex {
  padding-bottom: 2px !important;
}
div:has(> textarea[placeholder]) {
  width: 536px;
}
@media only screen and (min-width: 768px) {
  div:has(> textarea[placeholder]) {
    width: 700px;
  }
  div.flex.h-full.min-h-\\[100vh\\] > .hidden {
    position: fixed;
    top: 0;
    bottom: 0;
    background-color: rgb(243 243 238/var(--tw-bg-opacity));
    z-index: 9999;
  }
}
`;

const claude = `
fieldset.sm\\:sticky {
  top: -2000px;
  position: fixed !important;
  backdrop-filter: none;
  z-index: 9999;
}
fieldset.relative {
  bottom: -2000px !important;
}
fieldset label:has(input[type="file"]){
  position: fixed;
  width: 30px;
  height: 30px;
  bottom: 16px;
  right: 20px;
  background-color: white;
}
fieldset label:has(input[type="file"]):hover {
  background-color: light grey !important;
}
fieldset.relative label:has(input[type="file"]){
  bottom: 22px;
  right: 30px;
}
fieldset.relative::after{
  bottom: 12px;
  right: 20px;
}
aside, footer {
  display: none !important;
}
#q1CreateBtn-main, #q1CreateBtn-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #fff;
  cursor: pointer;
  z-index: 9999;
}
#q1CreateBtn-main {
  top: 16px;
  right: 16px;
}
#q1CreateBtn-menu {
  top: 16px;
  right: 68px;
}
body:has(form.contents input#email) #q1CreateBtn-main, body:has(form.contents input#email) #q1CreateBtn-menu {
  display: none !important;
}
`;

const localBase = `
.q1-tabs, .q1-tabInput, .q1-addTabButton, .q1-removeTabButton, .q1-tabInputLabel {
  position: fixed;
  top: -2000px;
}
.q1-tabPanels {
  width: 100%;
}
`;

function addStyle() {
  try {
    const { host, pathname } = window.location;
    if (host === 'images.google.com' && pathname === '/') {
      document.body.style.overflow = 'hidden';
    }
    if (host === 'www.google.com' && ['/', '/webhp'].includes(pathname)) {
      document.body.style.overflow = 'hidden';
    }

    var style = document.createElement('style');
    style.id = 'sssssss';
    switch (host) {
      case 'www.google.com':
        style.textContent = googleSearch;
        style.textContent += googleMap;
        break;
      case 'images.google.com':
        style.textContent = googleSearch;
        style.textContent += googleImage;
        break;
      case 'www.youtube.com':
        style.textContent = youtube;
        break;
      case 'translate.google.com':
        style.textContent = googleTranslate;
        break;
      case 'poe.com':
        style.textContent = poe;
        break;
      case 'bard.google.com':
        style.textContent = bard;
        break;
      case 'beta.character.ai':
        style.textContent = character;
        break;
      case 'chat.openai.com':
        style.textContent = chatGPT;
        break;
      case 'huggingface.co':
        style.textContent = huggingFace;
        break;
      case 'pi.ai':
        style.textContent = heypi;
        break;
      case 'www.bing.com':
        style.textContent = bing;
        break;
      case 'www.perplexity.ai':
        style.textContent = perplexity;
        break;
      case 'claude.ai':
        style.textContent = claude;
        break;
      case 'localhost:8000':
        style.textContent = localBase;
        break;
      default:
        break;
    }

    if (
      ![
        'bard.google.com',
        'chat.openai.com',
        'www.youtube.com',
        'huggingface.co',
      ].includes(host)
    ) {
      style.textContent += `
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
    }`;
    }

    style.textContent += defaultStyle;
    document.head.appendChild(style);
  } catch (error) {
    console.log(error);
  }
}

setTimeout(addStyle, 10);
const intervalId = setInterval(() => {
  if (document.getElementById('sssssss')) {
    clearInterval(intervalId);
  } else {
    addStyle();
  }
}, 20);
setTimeout(() => {
  clearInterval(intervalId);
}, 5000);

function handleOther() {
  const { host } = window.location;
  if (host === 'beta.character.ai') {
    localStorage.setItem('MOBILE_APP_ANNOUNCEMENT_SEEN', 'true');
    localStorage.setItem('OPTIONAL_COOKIES_ACCEPTED_0', 'true');
    localStorage.setItem('VISITED_0', 'true');
  } else if (host === 'chat.openai.com') {
    localStorage.setItem('oai/apps/hasSeenOnboarding/chat', getYYYYMMDD());
    localStorage.setItem('oai/apps/hasSeenBrowsingDisabledJuly2023', 'true');
  }
}
try {
  handleOther();
} catch (e) {
  console.log(e);
}

function getYYYYMMDD() {
  const now = new Date();
  function toZeroPrefix(number) {
    if (number < 10) return `0${number}`;
    return number.toString();
  }
  return `"${now.getFullYear()}-${toZeroPrefix(
    now.getMonth() + 1,
  )}-${now.getDate()}"`;
}
