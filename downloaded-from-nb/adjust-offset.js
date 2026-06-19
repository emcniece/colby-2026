;(function () {
  var header = document.getElementById('header');

  if (!header) return;

  var offsetTargets = [
    document.getElementById('hero'),
    document.getElementById('homepage'),
    document.getElementById('content')
  ];

  var windowHeight = window.innerHeight;
  var windowWidth = window.innerWidth;

  Media.media.addCallback(Media.EVENT_TYPE.ON_RESIZE, onResize);
  Media.media.addCallback(Media.EVENT_TYPE.ON_SAME_RESIZE, onSameResize);

  var navbarBrandImage = document.querySelector('.navbar-brand-image');
  if (navbarBrandImage) {
    navbarBrandImage.onload = onResize();
  } else {
    onResize();
  }

  /**
   * A callback function for a resize event
   *
   * It adjusts the offset of the page content
   * @returns {void}
   */
  function onResize() {
    var target = offsetTargets.find(function (el) { return el; });

    if (!target) return;

    if (!document.body.classList.contains('disable-sticky-nav')) {
      target.style.marginTop = header.offsetHeight + 'px';
    }

    if (document.body.classList.contains('session-page')) {
      target.style.minHeight = 'calc(100vh - ' + header.offsetHeight + 'px)';
    }
  }

  /**
   * Callback function for a resize event within the same breakpoint
   * @returns {void}
   */
  function onSameResize() {
    var newWindowHeight = window.innerHeight;
    var newWindowWidth = window.innerWidth;

    if (windowHeight !== newWindowHeight && windowWidth !== newWindowWidth) {
      windowHeight = newWindowHeight;
      windowWidth = newWindowWidth;

      onResize();
    }
  }
})();