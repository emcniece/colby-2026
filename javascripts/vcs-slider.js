;(function(root) {

  /**
   * @file Provides slider related functionality, using Bootstrap 4 carousel
   * @author Petar Zivkovic <arelenas@gmail.com>
   * @copyright Copyright (C) 2019 Van City Studios {@link https://www.vancitystudios.com/}
   */

   root.Slider = Slider;

  /**
   * Bootstrap 4 based slider
   * It can show multiple items at the same time and slides one item at a time
   * 
   * Constructor
   * @param {Object} carousel - Carousel jQuery object
   * @param {Object} [options] - Slider configuration options
   */
  function Slider(carousel, options) {
    options = options || {
      [Media.BREAKPOINT.XS]: {
        orientation: 'vertical',
        viewCount: 2
      },
      [Media.BREAKPOINT.MD]: {
        orientation: 'horizontal',
        viewCount: 2
      },
      [Media.BREAKPOINT.XL]: {
        orientation: 'horizontal',
        viewCount: 3
      }
    };

    // eslint-disable-next-line
    if (!(carousel instanceof jQuery)) {
      throw new TypeError('Invalid carousel type. It must be a jQuery object.');
    }

    if (carousel.length === 0) {
      throw new ReferenceError('Empty jQuery carousel object');
    }

    this.carousel = carousel;
    this.carouselEl = this.carousel.get(0);

    this.items = this.carouselEl.querySelectorAll('.carousel-item');
    if (!this.items) throw new ReferenceError('Couldn\'t find any carousel items.');

    this.options = options;

    Media.media.addCallback(Media.EVENT_TYPE.ON_RESIZE, this.onResize.bind(this));

    this.onResize(null, Media.media.getCachedCurrentMedia());
  }

  /**
   * Slider orientation constants
   * @type {Object}
   */
  Slider.ORIENTATION = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
  };

  /**
   * Media resize event listener
   * @private
   * @param {string} currentMedia
   * @param {string} newMedia
   * @returns {void}
   */
  Slider.prototype.onResize = function(currentMedia, newMedia) {
    var searchMedia = newMedia;

    // Checks if the new media was provided in the options
    // If not, loops through an ordered array of media strings,
    // going down, until it finds the media string that exists
    // in the options object
    while (!(searchMedia in this.options)) {
      searchMedia = Media.ARRAY[Media.ARRAY.indexOf(searchMedia) - 1];
    }

    var args = this.options[searchMedia];

    this.convert(args.orientation, args.viewCount);

    // If we have enough items to show, proceed
    if (this.options[searchMedia].viewCount < this.items.length) {
      this.carousel.carousel('cycle');
    } else {
      this.carousel.carousel('pause');
    }
  };

  /**
   * Converts the carousel to horizontal or vertical slider
   * @private
   * @param {string} orientation - Desired orientation for the slider
   * @param {number} viewCount - Number of elements to copy
   * @returns {void}
   */
  Slider.prototype.convert = function(orientation, viewCount) {
    if (orientation === Slider.ORIENTATION.HORIZONTAL) {
      this.carouselEl.classList.remove('carousel-vertical');

      this.carouselEl.querySelectorAll('.carousel-item').forEach(function(item) {
        item.classList.add('h-auto');
        item.firstElementChild.classList.add('float-left', 'pr-2');
      });
    } else if (orientation === Slider.ORIENTATION.VERTICAL) {
      this.carouselEl.classList.add('carousel-vertical');

      this.carouselEl.querySelectorAll('.carousel-item').forEach(function(item) {
        item.classList.remove('h-auto');
        item.firstElementChild.classList.remove('float-left', 'pr-2');
      });
    }

    var match = this.carouselEl.className.match(/slider--\d/);

    if (match) {
      this.carouselEl.classList.remove(match[0]);
    }

    this.carouselEl.classList.add('slider--' + viewCount);

    this.initItems(viewCount);
  };

  /**
   * Initializes carousel items by duplicating its succeeding siblings
   * @private
   * @param {number} viewCount - Number of succeeding siblings to copy
   * @returns {void}
   */
  Slider.prototype.initItems = function(viewCount) {
    if (this.items.length < 2) return;

    this.items.forEach(function(slide) {
      while (slide.firstElementChild !== slide.lastElementChild) {
        slide.removeChild(slide.lastElementChild);
      }
    });

    for (var i = 0; i < this.items.length; i += 1) {
      for (var j = 1; j <= viewCount && j < this.items.length; j += 1) {
        this.items[i].appendChild(
          this.items[(i + j) % this.items.length].firstElementChild.cloneNode(true)
        );
      }
    }
  };
})(window);