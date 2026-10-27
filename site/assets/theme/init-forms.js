;(function() {
  var form = document.querySelector('form');

  if (form) {
    new CustomControls();

    initDropzone(document.querySelectorAll('form .dropzone'));
    initSliders(document.querySelectorAll('.slider.carousel'));
  }

  /**
   * Init dropzones
   * @param {HTMLElement[]} dropzones
   * @returns {void}
   */
  function initDropzone(dropzones) {
    dropzones.forEach(function(dropzone) {
      new Dropzone(dropzone);
    });
  }

  /**
   * Init sliders
   * @param {HTMLElement[]} sliders
   * @returns {void}
   */
  function initSliders(sliders) {
    sliders.forEach(function(slider) {
      var items = slider.querySelectorAll('.carousel-item');

      if (items.length < 2) {
        slider.querySelector('.carousel-inner').classList.add('single-item');
        slider.querySelector('.slider-gradient').classList.add('d-none');
      }
    
      var isPageWide = ~document.body.className.indexOf('wide');
      var isDonation = ~document.body.className.indexOf('page-type-donation') || ~document.body.className.indexOf('page-type-donation-v2');
      var options;

      if (isDonation) {
        options = {
          [Media.BREAKPOINT.XS]: {
            orientation: Slider.ORIENTATION.VERTICAL,
            viewCount: 2
          },
          [Media.BREAKPOINT.XL]: {
            orientation: Slider.ORIENTATION.HORIZONTAL,
            viewCount: 2
          }
        };
      } else if (isPageWide) {
        options = {
          [Media.BREAKPOINT.XS]: {
            orientation: Slider.ORIENTATION.VERTICAL,
            viewCount: 2
          },
          [Media.BREAKPOINT.XL]: {
            orientation: Slider.ORIENTATION.HORIZONTAL,
            viewCount: 3
          }
        };
      } else {
        options = {
          [Media.BREAKPOINT.XS]: {
            orientation: Slider.ORIENTATION.VERTICAL,
            viewCount: 2
          }
        };
      }

      new Slider(jQuery(slider), options);
    });
  }
})();