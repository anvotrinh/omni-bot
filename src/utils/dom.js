export const copyToClipboard = (value) => {
  const tempInput = document.createElement('input');
  tempInput.style = 'position: absolute; left: -1000px; top: -1000px';
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
};

export const loadImage = (imgSrc) => {
  return new Promise((resolve, reject) => {
    const imgIcon = new Image();
    imgIcon.src = imgSrc;
    imgIcon.onload = () => resolve(imgSrc);
    imgIcon.onerror = () => reject(imgSrc);
  });
};

export const getTopMenuBarHeight = () => {
  if (document.body.classList.contains('sh-mini')) {
    return 0;
  }

  const iconDOM = document.querySelector('.tabDivWrapper');
  const navbarNotificationDOM = document.getElementById('navbarNotification');
  const notificationHeight = navbarNotificationDOM
    ? navbarNotificationDOM.clientHeight
    : 0;
  if (iconDOM) {
    return iconDOM.clientHeight + 6 + notificationHeight; // 6 padding
  }
  const topMenuBarDOM = document.querySelector('#topMenuBar');
  if (topMenuBarDOM) {
    return topMenuBarDOM.clientHeight;
  }
  const pageNavbarDOM = document.querySelector('.pageNavbar');
  if (pageNavbarDOM) {
    return pageNavbarDOM.clientHeight + notificationHeight;
  }
  return 36 + notificationHeight;
};

// without notification
export const getBaseTopMenuBarHeight = () => {
  const iconDOM = document.querySelector('.tabDivWrapper');
  if (iconDOM) {
    return iconDOM.clientHeight + 6; // 6 padding
  }
  return 36;
};

export const getBasePlatformBarHeight = () => {
  const iconDOM = document.querySelector('.tabDivWrapper');
  if (iconDOM) {
    return iconDOM.clientHeight + 8; // 8 padding
  }
  return 38;
};

export const changeWebviewImgPlaceholderHeight = function (data) {
  const viewviewsDOM = document.getElementById('webviews');
  if (!viewviewsDOM) return;
  const height =
    document.body.clientHeight - data.height - data.topMenuBarHeight;
  viewviewsDOM.style.height = height + 'px';
  viewviewsDOM.style.marginTop = data.topMenuBarHeight + 'px';
};
