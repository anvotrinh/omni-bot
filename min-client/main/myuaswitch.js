let hasCustomUserAgent = false;

function enableUASwitch(ses) {
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    if (!hasCustomUserAgent) {
      if (
        details.url.includes("google.com") ||
        details.url.includes("gmail.com")
      ) {
        details.requestHeaders["User-Agent"] =
          "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36";
      } else if (details.url.includes("bing.com")) {
        details.requestHeaders["User-Agent"] =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.0.0";
      }
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
}

app.once("ready", function () {
  enableUASwitch(session.defaultSession);
});

app.on("session-created", enableUASwitch);
