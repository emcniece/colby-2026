;(function() {
  var previous = document.scripts[document.scripts.length -1].previousElementSibling.previousElementSibling;

  var captions = Array.from(previous.querySelectorAll('.carousel-caption'));

  // Check if this is a hero slider (skip height adjustments for hero sliders)
  var isHeroSlider = previous && previous.classList.contains('hero-slider');

  if (captions && captions.length > 0) {
    $(document).on('click', '.carousel-caption button', function() {
      var fullUrl = $(this).data('fullurl');
      if (fullUrl) {
        window.location = fullUrl;
      }
    });

    // Only add resize handling for non-hero sliders
    if (!isHeroSlider) {
      Media.media.addCallback(Media.EVENT_TYPE.ON_RESIZE, onResize);
      onResize(null, Media.media.getCachedCurrentMedia());
    }
  }

  /**
   * A callback for a resize event
   * @param {string} oldCurrentMedia
   * @param {string} newMedia
   * @returns {void}
   */
  function onResize(oldCurrentMedia, newMedia) {
    if (! newMedia) return;

    var carouselItems = previous.querySelectorAll('.carousel-item');

    if (~[Media.BREAKPOINT.XS, Media.BREAKPOINT.SM].indexOf(newMedia)) {
      captions.forEach(function(caption) {
        getParents(caption, '.carousel-item')[0].appendChild(caption);
      });

      var maxHeight = 0;

      carouselItems.forEach(function(item) {
        item.style.display = 'block';
        maxHeight = maxHeight >= item.offsetHeight ? maxHeight : item.offsetHeight;
        item.style.display = '';
      });

      carouselItems.forEach(function(item) {
        item.style.height = maxHeight + 'px';

        if (!item.querySelector('.carousel-caption')) {
          item.firstElementChild.style.setProperty('height', '100%', 'important');
        }
      });
    } else {
      captions.forEach(function(caption) {
        getParents(caption, '.carousel-item')[0].firstElementChild.appendChild(caption);
      });

      carouselItems.forEach(function(item) {
        item.style.height = '';
        item.firstElementChild.style.height = '';
      });
    }
  }
})();
