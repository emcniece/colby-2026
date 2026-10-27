// Stand-ins for the NationBuilder runtime globals the theme scripts expect.
window.NB = window.NB || {};
NB.appConfig = NB.appConfig || { userIsLoggedIn: false, pageTagsList: "" };
NB.payments = NB.payments || { elements: {} };
NB.Liquid = NB.Liquid || {};
NB.Liquid.MoneyBomb = NB.Liquid.MoneyBomb || function () { this.setCountdown = function () {}; };
NB.EventHub = NB.EventHub || (function () {
  var subs = {};
  return {
    subscribe: function (name, fn) { (subs[name] = subs[name] || []).push(fn); },
    dispatch: function (name, args) { (subs[name] || []).forEach(function (fn) { fn(args); }); }
  };
})();
window.setTimeAgo =window.setTimeAgo || function () {};
window.ImgCropper = window.ImgCropper || null;
if (window.jQuery && !jQuery.browser) jQuery.browser = {}; // removed in jQuery 1.9; NB's bundle restored it

// Custom form scripts refuse to submit without a CSRF token; give them a placeholder.
(function () {
  var meta = document.createElement('meta');
  meta.name = 'csrf-token';
  meta.content = 'static';
  document.head.appendChild(meta);
})();
