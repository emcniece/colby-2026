;(function() {
  var header = document.getElementById('header');

  // Ensure that mobile version of header is displayed on mobile devices
  if (navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
  ) {
    var navbarToolbar = document.getElementById('navbar-toolbar');

    var navbarBrandContainer = header.querySelector('.navbar-brand-container');
    var navbarSupporterNavLink = header.querySelector('.navbar-supporter-nav-link');
    var navbarToolbarItem = navbarToolbar.querySelector('.navbar-toolbar-item');

    header.classList.remove('navbar-expand-md');
    navbarBrandContainer.classList.remove('p-md-0', 'px-md-3');
    navbarSupporterNavLink.classList.remove('d-md-none');

    navbarToolbar.classList.remove('mt-md-0', 'mb-md-0');
    navbarToolbarItem.classList.remove('mb-md-0');
    navbarToolbarItem.firstElementChild.classList.remove('d-md-block');

    
    header.classList.add('navbar-expand-xl');
    navbarBrandContainer.classList.add('p-xl-0', 'px-xl-3');
    navbarSupporterNavLink.classList.add('d-xl-none');

    navbarToolbar.classList.add('mt-xl-0', 'mb-xl-0');
    navbarToolbarItem.classList.add('mb-xl-0');
    navbarToolbarItem.firstElementChild.classList.add('d-xl-block');
  }

  var match = header.className.match(/navbar-expand-(\w{2})/);

  if (match) {
    var breakpoint = match[1];
    var primaryNav = document.getElementById('primaryNav');

    if (~Media.ARRAY.indexOf(breakpoint)) {
      Media.media.addCallback(Media.EVENT_TYPE.ON_RESIZE, onResize);

      onResize(null, Media.media.getCachedCurrentMedia());
    }
  }
  
  /**
   * A callback function for a resize event
   *
   * It recolates nav menu depending on the currently active breakpoint
   * @param {string} oldCurrentMedia
   * @param {string} newMedia
   * @returns {void}
   */
  function onResize(oldCurrentMedia, newMedia) {
    if (Media.ARRAY.indexOf(newMedia) >= Media.ARRAY.indexOf(breakpoint)) {
      header.firstElementChild.appendChild(primaryNav);
    } else {
      header.appendChild(primaryNav);
    }
  }
})();