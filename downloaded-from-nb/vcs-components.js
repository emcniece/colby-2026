// share twitter w/ custom message hardcoded
function twShareCustom(url, message, winWidth, winHeight) {
  var winTop = (screen.height / 2) - (winHeight / 2);
  var winLeft = (screen.width / 2) - (winWidth / 2);
  window.open('https://twitter.com/share?url=' + url + '&text=' + message, 'twsharer', 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
}
// share facebook
function fbShare(url, winWidth, winHeight) {
  var winTop = (screen.height / 2) - (winHeight / 2);
  var winLeft = (screen.width / 2) - (winWidth / 2);
  window.open('http://www.facebook.com/sharer.php?u=' + url, 'fbsharer', 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
}
// share linkedin
function lShare(url, title, message, winWidth, winHeight) {
  var winTop = (screen.height / 2) - (winHeight / 2);
  var winLeft = (screen.width / 2) - (winWidth / 2);
  window.open('https://www.linkedin.com/shareArticle?mini=true&url=' + url + '&title=' + title + '&summary=' + message, 'lsharer', 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
}
function eShare(subject,emailBody) {
  window.open('mailto:?subject=' + subject + '&body=' +   emailBody);
}
