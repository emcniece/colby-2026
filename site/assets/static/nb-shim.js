// Stand-ins for the NationBuilder runtime globals the theme scripts expect.
window.NB = window.NB || {};
NB.appConfig = NB.appConfig || { userIsLoggedIn: false, pageTagsList: "" };
NB.payments = NB.payments || { elements: {} };
NB.Liquid = NB.Liquid || {};
NB.Liquid.MoneyBomb = NB.Liquid.MoneyBomb || function () { this.setCountdown = function () {}; };
window.setTimeAgo = window.setTimeAgo || function () {};

// Custom form scripts refuse to submit without a CSRF token; give them a placeholder.
(function () {
  var meta = document.createElement('meta');
  meta.name = 'csrf-token';
  meta.content = 'static';
  document.head.appendChild(meta);
})();
