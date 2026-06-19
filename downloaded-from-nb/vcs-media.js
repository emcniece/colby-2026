;(function(root) {

  /**
   * @file Provides functionality related to media change on resize and orientation change
   * @author Petar Zivkovic <arelenas@gmail.com>
   * @copyright Copyright (C) 2019 Van City Studios {@link https://www.vancitystudios.com/}
   */

  root.Media = Media;

  /**
   * Provides all functionality related to media change on resize and orientation change
   * Constructor
   * @param {number} [delay=150] - Debounce delay in ms
   * @param {Function[]} [resizeCallbacks=[]] - Array of resize callbacks
   * @param {Function[]} [sameMediaResizeCallbacks=[]] - Array of same media resize callbacks
   * @param {Function[]} [orientationCallbacks=[]] - Array of orientation change callbacks
   */
  function Media(delay, resizeCallbacks, sameMediaResizeCallbacks, orientationCallbacks) {
    delay = delay || 150;
    resizeCallbacks = resizeCallbacks || [];
    sameMediaResizeCallbacks = sameMediaResizeCallbacks || [];
    orientationCallbacks = orientationCallbacks || [];

    this.resizeCallbacks = resizeCallbacks;
    this.sameMediaResizeCallbacks = sameMediaResizeCallbacks;
    this.orientationCallbacks = orientationCallbacks;
    this.currentMedia = null;
    this.currentOrientation = null;
    this.atSm = window.matchMedia('(min-width: 576px)');
    this.atMd = window.matchMedia('(min-width: 768px)');
    this.atLg = window.matchMedia('(min-width: 992px)');
    this.atXl = window.matchMedia('(min-width: 1200px)');
    this.portrait = window.matchMedia('(orientation: portrait)');

    window.addEventListener('resize', _.debounce(this.onResize.bind(this), delay));
    window.addEventListener('orientationchange', _.debounce(this.onOrientationChange.bind(this), delay));

    this.onResize();
    this.onOrientationChange();
  }

  /**
   * Constants for Event types
   * @type {Object}
   */
  Media.EVENT_TYPE = {
    ON_RESIZE: 'onResize',
    ON_SAME_RESIZE: 'onSameResize',
    ON_ORIENTATION_CHANGE: 'onOrientationChange'
  };

  /**
   * Constants for Breakpoints
   * @type {Object}
   */
  Media.BREAKPOINT = {
    XL: 'xl',
    LG: 'lg',
    MD: 'md',
    SM: 'sm',
    XS: 'xs'
  };

  /**
   * Ordered array of Breakpoint constants
   * @type {string[]}
   */
  Media.ARRAY = [
    Media.BREAKPOINT.XS,
    Media.BREAKPOINT.SM,
    Media.BREAKPOINT.MD,
    Media.BREAKPOINT.LG,
    Media.BREAKPOINT.XL
  ];

  /**
   * Constants for orientations
   * @type {Object}
   */
  Media.ORIENTATION = {
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape'
  };

  /**
   * Handle resize events
   * @private
   * @returns {void}
   */
  Media.prototype.onResize = function() {
    var newMedia;

    if (this.atXl.matches) {
      newMedia = Media.BREAKPOINT.XL;
    } else if (this.atLg.matches) {
      newMedia = Media.BREAKPOINT.LG;
    } else if (this.atMd.matches) {
      newMedia = Media.BREAKPOINT.MD;
    } else if (this.atSm.matches) {
      newMedia = Media.BREAKPOINT.SM;
    } else {
      newMedia = Media.BREAKPOINT.XS;
    }

    if (newMedia !== this.currentMedia) {
      var oldCurrentMedia = this.currentMedia;

      this.currentMedia = newMedia;

      this.resizeCallbacks.forEach(function(callback) {
        callback(oldCurrentMedia, newMedia, this.currentOrientation);
      }.bind(this));
    } else {
      this.sameMediaResizeCallbacks.forEach(function(callback) {
        callback(this.currentMedia, this.currentOrientation);
      }.bind(this));
    }
  };

  /**
   * Handle orientation change events
   * @private
   * @returns {void}
   */
  Media.prototype.onOrientationChange = function() {
    var newOrientation;

    if (this.portrait.matches) {
      newOrientation = Media.ORIENTATION.PORTRAIT;
    } else {
      newOrientation = Media.ORIENTATION.LANDSCAPE;
    }

    if (newOrientation !== this.currentOrientation) {
      this.orientationCallbacks.forEach(function(callback) {
        callback(this.currentOrientation, newOrientation, this.currentMedia);
      }.bind(this));

      this.currentOrientation = newOrientation;
    }
  };

  /**
   * Get current media from the cache
   * @returns {string}
   */
  Media.prototype.getCachedCurrentMedia = function() {
    return this.currentMedia;
  };

  /**
   * Get current media by querying the media, not using cache
   * @returns {string}
   */
  Media.prototype.getCurrentMedia = function() {
    var media;

    if (this.atXl.matches) {
      media = Media.BREAKPOINT.XL;
    } else if (this.atLg.matches) {
      media = Media.BREAKPOINT.LG;
    } else if (this.atMd.matches) {
      media = Media.BREAKPOINT.MD;
    } else if (this.atSm.matches) {
      media = Media.BREAKPOINT.SM;
    } else {
      media = Media.BREAKPOINT.XS;
    }

    return media;
  };

  /**
   * Get current media orientation
   * @returns {string}  String of the current orientation
   */
  Media.prototype.getCurrentOrientation = function() {
    var orientation;

    if (this.portrait.matches) {
      orientation = Media.ORIENTATION.PORTRAIT;
    } else {
      orientation = Media.ORIENTATION.LANDSCAPE;
    }

    return orientation;
  };

  /**
   * Add callback
   * @param {string} type - callback type
   * @param {function(string, string, string):void} callback
   * @returns {void}
   */
  Media.prototype.addCallback = function(type, callback) {
    if (!hasValue(Media.EVENT_TYPE, type)) throw new TypeError('Wrong Media.EVENT_TYPE value');

    var arr;

    if (type === Media.EVENT_TYPE.ON_RESIZE) {
      arr = this.resizeCallbacks;
    } else if (type === Media.EVENT_TYPE.ON_SAME_RESIZE) {
      arr = this.sameMediaResizeCallbacks;
    } else if (type === Media.EVENT_TYPE.ON_ORIENTATION_CHANGE) {
      arr = this.orientationCallbacks;
    }

    if (!arr.includes(callback)) {
      arr.push(callback);
    }

    return true;
  };

  /**
   * Remove callback
   * @param {string} type - callback type
   * @param {function(string, string, string):void} callback
   * @returns {void}
   */
  Media.prototype.removeCallback = function(type, callback) {
    if (!hasValue(Media.EVENT_TYPE, type)) throw new TypeError('Wrong Media.EVENT_TYPE value');

    var arr;

    if (type === Media.EVENT_TYPE.ON_RESIZE) {
      arr = this.resizeCallbacks;
    } else if (type === Media.EVENT_TYPE.ON_SAME_RESIZE) {
      arr = this.sameMediaResizeCallbacks;
    } else if (type === Media.EVENT_TYPE.ON_ORIENTATION_CHANGE) {
      arr = this.orientationCallbacks;
    }

    arr.splice(arr.indexOf(callback), 1);
  };

  /**
   * Static Media object
   * @type {Media}}
   */
  Media.media = new Media();
})(window);