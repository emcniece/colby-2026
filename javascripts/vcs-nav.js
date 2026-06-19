;(function(root) {

  /**
   * @file Provides main navigation menu functionality
   * @author Petar Zivkovic <arelenas@gmail.com>
   * @copyright Copyright (C) 2019 Van City Studios {@link https://www.vancitystudios.com/}
   */

  root.Nav = Nav;

  /**
   * Provides all functionality related to the main navigation menu
   * 
   * Constructor
   * @param {string|HTMLElement} [nav='#primaryNav'] - Selector for the nav element
   * @param {Object} [options] - Configuration options
   */
  function Nav(nav, options) {
    nav = nav || '#primaryNav';
    options = options || {};

    options.animationDuration = options.animationDuration || 200;
    options.gridBreakpoint = options.gridBreakpoint || Media.BREAKPOINT.MD;

    if (typeof nav !== 'string' && !(nav instanceof HTMLElement)) {
      throw new TypeError('Invalid nav type. It must be a string or HTMLElement.');
    }

    if (typeof options.gridBreakpoint !== 'string') {
      throw new TypeError('Invalid gridBreakpoint type. It must be a string.');
    }

    if (Number.isNaN(+options.animationDuration)) {
      throw new TypeError('Invalid animationDuration type. It must be a number.');
    }

    this.navElement = nav instanceof HTMLElement ? nav : document.querySelector(nav);
    if (!this.navElement) throw new ReferenceError('Invalid nav selector.');

    if (!hasValue(Media.BREAKPOINT, options.gridBreakpoint)) {
      throw new ReferenceError('Invalid gridBreakpoint value');
    }

    this.options = options;

    this.cachedElements = new Map();
    this.activeAnimations = new Map();
    this.touchedElements = new Map();

    // Set the minimum dropdown menu width and height used in calculations
    var anyDropdownMenu = this.navElement.querySelector('.' + Nav.CLASS.DROPDOWN_MENU);

    if (anyDropdownMenu) {
      var minDropdownWidth = getComputedStyle(anyDropdownMenu).getPropertyValue('min-width');
      var minDropdownHeight = getComputedStyle(anyDropdownMenu).getPropertyValue('min-height');

      this.minDropdownWidth = minDropdownWidth !== '0px' ? minDropdownWidth : 250;
      this.minDropdownHeight = minDropdownHeight !== '0px' ? minDropdownHeight : 114;
    }

    this.navElement.addEventListener('mouseover', function(e) {
      if (this.touchedElements.has(e.target)) {
        this.touchedElements.delete(e.target);
      } else if (this.navElement.classList.contains(Nav.CLASS.TOUCH)) {
        this.navElement.classList.remove(Nav.CLASS.TOUCH);
      }

      if (!this.shouldCollapse() && !window.grabbedElement) {
        var dropdownToggle = this.constructor.getDropdownToggle(e.target);

        if (dropdownToggle) {
          var dropdown = this.constructor.getDropdown(dropdownToggle);

          if (!this.constructor.isDropdownOpen(dropdown)) {
            var dropdownMenu = this.constructor.findDropdownMenu(dropdown);

            dropdown.classList.add(Nav.CLASS.OPEN);

            this.showNavElement(dropdownMenu)
              .then(function(el) { return this.cleanUpAfterShowNavElement(el) }.bind(this));
          }
        }
      }
    }.bind(this));

    /**
    * If mouseout event we want to hide all parent dropdown menus on widths >768px
    */
    document.addEventListener('mouseout', function(e) {
      if (!this.shouldCollapse() && this.navElement.contains(e.target) && !window.grabbedElement) {
        getParents(e.target, '.' + Nav.CLASS.DROPDOWN + '.' + Nav.CLASS.OPEN).forEach(function(openDropdown) {
          if (!openDropdown.contains(e.relatedTarget)) {
            openDropdown.classList.remove(Nav.CLASS.OPEN);

            this.hideNavElement(this.constructor.findDropdownMenu(openDropdown))
              .then(function(el) { return this.cleanUpAfterHideNavElement(el) }.bind(this));
          }
        }.bind(this));
      }
    }.bind(this));

    /**
    * If touch is detected disable hover effects and enable dropdown menu copy
    */
    this.navElement.addEventListener('touchstart', function(e) {
      this.touchedElements.set(e.target);

      if (!this.navElement.classList.contains(Nav.CLASS.TOUCH)) {
        this.navElement.classList.add(Nav.CLASS.TOUCH);
      }
    }.bind(this), { passive: true });

    /**
    * Use a click event for toggling dropdown menus when using touch
    */
    this.navElement.addEventListener('click', function(e) {
      var dropdownToggle = this.constructor.getDropdownToggle(e.target);

      if (dropdownToggle
        && (this.navElement.classList.contains(Nav.CLASS.TOUCH)
        || this.shouldCollapse())) {
        var dropdown = this.constructor.getDropdown(dropdownToggle);
        var dropdownMenu = this.constructor.findDropdownMenu(dropdown);

        if (this.constructor.isDropdownOpen(dropdown)) {
          dropdown.classList.remove(Nav.CLASS.OPEN);

          Promise.all(
            Array.from(dropdownMenu.querySelectorAll('.' + Nav.CLASS.DROPDOWN + '.' + Nav.CLASS.OPEN))
              .reverse()
              .map(function(openDropdown) {
                openDropdown.classList.remove(Nav.CLASS.OPEN);

                return this.hideNavElement(this.constructor.findDropdownMenu(openDropdown));
              }.bind(this))
          )
            .then(function(elements) { elements.forEach(function(el) { this.cleanUpAfterHideNavElement(el) }.bind(this)) });

          this.hideNavElement(dropdownMenu)
            .then(function() { this.cleanUpAfterHideNavElement(dropdownMenu) }.bind(this));
        } else {
          dropdown.classList.add(Nav.CLASS.OPEN);

          this.showNavElement(dropdownMenu)
            .then(function(el) { this.cleanUpAfterShowNavElement(el) }.bind(this));
        }

        e.preventDefault();
      }
    }.bind(this));

    /*
    * When a user press enter on a dropdown toggle, activate the dropdown
    * We are basically, triggering the 'touchstart' event as we want the menu to behave the same
    * as when we use touch interface,
    * and then triggering the 'click' event to actually open the menu
    */
    this.navElement.addEventListener('keydown', function(e) {
      var dropdownToggle = this.constructor.getDropdownToggle(e.target);

      if (dropdownToggle && e.keyCode === 13) {
        e.preventDefault();

        var touchEvent = new Event('touchstart', {
          bubbles: true,
          cancelable: true
        });

        var clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });

        e.target.dispatchEvent(touchEvent);
        e.target.dispatchEvent(clickEvent);
      }
    }.bind(this));

    /*
    * Listen for a focusout event and close the open menu
    */
    this.navElement.addEventListener('focusout', function(e) {
      if (!e.target.classList.contains(Nav.CLASS.DROPDOWN_ITEM)
        && !e.target.classList.contains(Nav.CLASS.DROPDOWN_TOGGLE)
      ) return;

      getParents(e.target, '.' + Nav.CLASS.DROPDOWN + '.' + Nav.CLASS.OPEN).forEach(function(openDropdown) {
        if (!openDropdown.contains(e.relatedTarget)) {
          openDropdown.classList.remove(Nav.CLASS.OPEN);

          this.hideNavElement(this.constructor.findDropdownMenu(openDropdown))
            .then(function(el) { this.cleanUpAfterHideNavElement(el) }.bind(this));
        }
      });
    });

    window.jQuery(this.navElement).on('hidden.bs.collapse', function(e) {
      this.navElement.querySelectorAll('.' + Nav.CLASS.DROPDOWN_MENU + '.' + Nav.CLASS.OPEN).forEach(function(openDropdown) {
        if (!openDropdown.contains(e.relatedTarget)) {
          openDropdown.classList.remove(Nav.CLASS.OPEN);

          this.hideNavElement(this.constructor.findDropdownMenu(openDropdown))
            .then(function(el) { this.cleanUpAfterHideNavElement(el) }.bind(this));
        }
      });
    }.bind(this));

    /**
    * On resize when media changes
    */
    Media.media.addCallback(Media.EVENT_TYPE.ON_RESIZE, function() {
      this.init();
    }.bind(this));

    /**
    * On resize when media doesn't change
    */
    Media.media.addCallback(Media.EVENT_TYPE.ON_SAME_RESIZE, function() {
      if (this.windowHeight !== window.innerHeight && this.windowWidth !== window.innerWidth) {
        this.init();
      }
    }.bind(this));

    /**
    * On orientation change
    */
    Media.media.addCallback(Media.EVENT_TYPE.ON_ORIENTATION_CHANGE, function() {
      this.init();
    }.bind(this));

    this.init();
  }

  /**
  * Constants for navigation classes
  * @type {Object}
  */
  Nav.CLASS = {
    DROPDOWN: 'dropdown',
    DROPDOWN_MENU: 'dropdown-menu',
    DROPDOWN_ITEM: 'dropdown-item',
    DROPDOWN_TOGGLE: 'dropdown-toggle',
    NAV_LIST: 'navbar-nav',
    OPEN: 'show',
    TOUCH: 'touch'
  };

  /**
  * Initializes internal state of the object
  * @private
  * @return {void}
  */
  Nav.prototype.init = function() {
    this.cachedElements.clear();

    // Store window height and width
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;

    var dropdownMenus = this.navElement.querySelectorAll('.' + Nav.CLASS.DROPDOWN_MENU);

    dropdownMenus.forEach(function(dropdownMenu) {
      this.cancelAnimate(dropdownMenu);
      dropdownMenu.removeAttribute('style');
    }.bind(this));

    // Cache all dropdown menu elements
    this.navElement.style.display = 'block';

    dropdownMenus.forEach(function(dropdownMenu) {
      if (this.shouldCollapse()) {
        dropdownMenu.style.height = 'auto';
        this.getBoundingClientRect(dropdownMenu);
        dropdownMenu.style.height = '';
      } else {
        this.getBoundingClientRect(dropdownMenu);

        var dropdown = this.constructor.getDropdown(dropdownMenu);

        if (dropdownMenu.classList.contains(Nav.CLASS.OPEN)) {
          dropdown.classList.remove(Nav.CLASS.OPEN);
          dropdownMenu.classList.remove(Nav.CLASS.OPEN);
        }

        // Recalculate open dropdown positions
        if (Object.prototype.hasOwnProperty.call(dropdownMenu, 'data-simple-scrollbar')) {
          var prop = dropdownMenu['data-simple-scrollbar'];

          while (prop.el.firstChild) {
            prop.target.appendChild(prop.el.firstChild);
          }

          prop.target.removeChild(prop.target.firstChild);
          prop.target.removeChild(prop.target.firstChild);

          delete dropdownMenu['data-simple-scrollbar'];
        }

        this.adjustDropdown(dropdown);
      }
    }.bind(this));

    if (this.shouldCollapse()) {
      this.navElement.querySelectorAll('.' + Nav.CLASS.DROPDOWN_ITEM + ', .' + Nav.CLASS.DROPDOWN).forEach(function(el) {
        el.style.width = '';
        el.style.whiteSpace = '';
      });

      // Set the maximum height of the nav container on widths <768px
      this.navElement.style.maxHeight = this.windowHeight - this.getBoundingClientRect(this.navElement).top + 'px';
    }

    this.navElement.style.display = '';
  };

  /**
  * Should the menu be collapsed in current media
  * @private
  * @returns {Boolean} - True if menu should collapse, false otherwise
  */
  Nav.prototype.shouldCollapse = function() {
    return Media.ARRAY.indexOf(Media.media.getCachedCurrentMedia())
      < Media.ARRAY.indexOf(this.options.gridBreakpoint);
  };

  /**
  * Check if the dropdown is open
  * @private
  * @param {HTMLElement} dropdown - Dropdown menu item
  * @returns {boolean} - True if the dropdown matches the dropdown open selector
  */
  Nav.isDropdownOpen = function(dropdown) {
    return dropdown.classList.contains(Nav.CLASS.OPEN);
  };

  /**
  * Return the dropdown toggle parent element
  * @private
  * @param {HTMLElement} el - HTML element
  * @returns {HTMLElement}
  */
  Nav.getDropdownToggle = function(el) {
    return el.closest('.' + Nav.CLASS.DROPDOWN_TOGGLE);
  };

  /**
  * Return the dropdown toggle of the dropdown element
  * @private
  * @param {HTMLElement} dropdown - Dropdown element
  * @returns {HTMLElement}
  */
  Nav.findDropdownToggle = function(dropdown) {
    return dropdown.querySelector('.' + Nav.CLASS.DROPDOWN_TOGGLE);
  };

  /**
  * Return the dropdown element
  * @private
  * @param {HTMLElement} el - HTML element
  * @returns {HTMLElement}
  */
  Nav.getDropdown = function(el) {
    return el.closest('.' + Nav.CLASS.DROPDOWN);
  };

  /**
  * Return the dropdown menu element for the given dropdown
  * @private
  * @param {HTMLElement} dropdown - Dropdown element
  * @returns {HTMLElement}
  */
  Nav.findDropdownMenu = function(dropdown) {
    return dropdown.querySelector('.' + Nav.CLASS.DROPDOWN_MENU);
  };

  /**
  * Adjust position of the open dropdown if it goes out of the BODY bounds
  * @private
  * @param {HTMLElement} dropdown - Dropdown menu item
  * @returns {void}
  */
  Nav.prototype.adjustDropdown = function(dropdown) {
    var dropdownMenu = this.constructor.findDropdownMenu(dropdown);

    // Clear inline element styles used for dropdown adjustment
    dropdownMenu.style.left = '';
    dropdownMenu.style.right = '';
    dropdownMenu.style.width = '';
    dropdownMenu.style.height = '';
    dropdownMenu.style.whiteSpace = '';
    dropdownMenu.style.top = '';
    dropdownMenu.style.bottom = '';

    Array.from(dropdownMenu.children).forEach(function(el) {
      if (getParents(el, '.' + Nav.CLASS.DROPDOWN_MENU)[0] === dropdownMenu) {
        el.style.width = '';
        el.style.whiteSpace = '';
      }
    });

    var dropdownRect = this.getBoundingClientRect(dropdown);
    var dropdownMenuRect = this.getBoundingClientRect(dropdownMenu);

    if (dropdownMenuRect.right > this.windowWidth) {
      // Dropdown menu passing the right edge of the viewport

      // Available space between the right of the dropdown element
      // and the right edge of the viewport
      var rightSpace = this.windowWidth - dropdownRect.right;

      if (rightSpace >= this.minDropdownWidth
        || dropdown.parentElement.classList.contains(Nav.CLASS.NAV_LIST)) {
        // If there is enough space on the right or this is the dropdown menu of the first level,
        // fit the dropdown menu in the remaining space
        dropdownMenu.style.width = rightSpace + 'px';

        dropdownMenu.style.whiteSpace = 'normal';
      } else {
        // If there is not enough space on the right or the dropdown menu is not of the first level,
        // move the dropdown menu to the left of the dropdown element

        dropdownMenu.style.left = 'auto';
        dropdownMenu.style.right = dropdownRect.width + 'px';

        if (dropdownMenuRect.width > dropdownRect.left) {
          // If dropdown menu width is greater then the available space on the left,
          // adjust the dropdown menu width
          dropdownMenu.style.width = dropdownRect.left + 'px';
          dropdownMenu.style.whiteSpace = 'normal';
        }
      }
    }

    if (dropdownMenuRect.bottom > this.windowHeight) {
      // Dropdown menu below the bottom of the viewport

      // Available space between the bottom of the dropdown element and the bottom of the viewport
      var bottomSpace;

      if (dropdown.parentElement.classList.contains(Nav.CLASS.NAV_LIST)) {
        bottomSpace = this.windowHeight - dropdownRect.bottom;
      } else {
        bottomSpace = this.windowHeight - dropdownRect.bottom + dropdownRect.height;
      }

      if (bottomSpace > this.minDropdownHeight) {
        // Available space at the bottom is larger than our minimaly required space so set
        // the dropdown menu height to what is available and make it scrollable
        dropdownMenu.style.height = bottomSpace + 'px';
        window.SimpleScrollbar.initEl(dropdownMenu);
      } else {
        // Available space at the bottom is smaller that our minimaly required space so make
        // the bottom of the dropdown menu the same as the dropdown element
        dropdownMenu.style.top = 'auto';
        dropdownMenu.style.bottom = '0';

        if (dropdownMenuRect.height > dropdownRect.bottom) {
          // Dropdown menu height is larger than the space between the top of the viewport
          // and the bottom of our dropdown element, so set the dropdown menu height to available
          // space and make it scrollable.
          dropdownMenu.style.height = dropdownRect.bottom + 'px';
          window.SimpleScrollbar.initEl(dropdownMenu);
        }
      }
    }

    var dropdownMenuWidth = getComputedStyle(dropdownMenu).getPropertyValue('width');

    Array.from(dropdownMenu.children).forEach(function(el) {
      if (getParents(el, '.' + Nav.CLASS.DROPDOWN_MENU)[0] === dropdownMenu) {
        el.style.width = dropdownMenuWidth;
        el.style.whiteSpace = 'normal';
      }
    });
  };

  /**
  * Clean up after showing nav element
  * @private
  * @param {HTMLElement} el
  * @returns {void}
  */
  Nav.prototype.cleanUpAfterShowNavElement = function(el) {
    if (this.shouldCollapse()) {
      el.style.overflow = 'visible';
      el.style.height = 'auto';
    } else {
      this.constructor.findDropdownToggle(this.constructor.getDropdown(el)).setAttribute('aria-expanded', 'true');
    }
  };

  /**
  * Clean up after hidding nav element
  * @private
  * @param {HTMLElement} el
  * @returns {void}
  */
  Nav.prototype.cleanUpAfterHideNavElement = function(el) {
    if (!this.shouldCollapse()) {
      el.style.visibility = 'hidden';
    } else {
      this.constructor.findDropdownToggle(this.constructor.getDropdown(el)).setAttribute('aria-expanded', 'false');
    }
  };

  /**
  * Show element with animation
  * @private
  * @param {HTMLElement} el
  * @return {Promise<HTMLElement>}
  */
  Nav.prototype.showNavElement = function(el) {
    return new Promise(function(resolve) {
      el.classList.add(Nav.CLASS.OPEN);

      var tMin = 0;
      var tMax;
      var duration = this.options.animationDuration;
      var rAnimation = this.cancelAnimate(el);

      if (rAnimation) {
        duration = rAnimation.timeElapsed;

        tMin = rAnimation.props.height ? rAnimation.props.height : rAnimation.props.opacity;
      }

      var timingFn = new window.BezierEasing(0.25, 0.1, 0.25, 1.0);

      if (this.shouldCollapse()) {
        var elRect = this.getBoundingClientRect(el);

        if (!tMax) {
          tMax = elRect.height;
        }

        el.style.height = '0px';

        this.animate(el, function(progress) {
          var height = this.constructor.normalize(timingFn(progress), 0, 1, tMin, tMax);

          el.style.height = height + 'px';
          el.scrollIntoView();

          return { height };
        }.bind(this), duration)
          .then(function() { resolve(el) });
      } else {
        if (!tMax) {
          tMax = 1;
        }

        el.style.visibility = 'visible';

        this.animate(el, function(progress) {
          var opacity = this.constructor.normalize(timingFn(progress), 0, 1, tMin, tMax);

          el.style.opacity = opacity;

          return { opacity };
        }.bind(this), duration)
          .then(function() { resolve(el) });
      }
    }.bind(this));
  };

  /**
  * Hide element with animation
  * @private
  * @param {HTMLElement} el
  * @returns {Promise<HTMLElement>}
  */
  Nav.prototype.hideNavElement = function(el) {
    return new Promise(function(resolve) {
      el.classList.remove(Nav.CLASS.OPEN);

      var tMin = 0;
      var tMax;
      var duration = this.options.animationDuration;
      var rAnimation = this.cancelAnimate(el);

      if (rAnimation) {
        duration = rAnimation.timeElapsed;

        tMax = rAnimation.props.height ? rAnimation.props.height : rAnimation.props.opacity;
      }

      var timingFn = new window.BezierEasing(0.75, 0, 0.75, 0.9);

      if (this.shouldCollapse()) {
        var elRect = this.getBoundingClientRect(el);

        if (!tMax) {
          tMax = elRect.height;
        }

        el.style.overflow = '';

        this.animate(el, function(progress) {
          var height = this.constructor.normalize(timingFn(1 - progress), 0, 1, tMin, tMax);

          el.style.height = height + 'px';

          return { height };
        }.bind(this), duration)
          .then(function() { resolve(el) });
      } else {
        if (!tMax) {
          tMax = 1;
        }

        this.animate(el, function(progress) {
          var opacity = tMax - this.constructor.normalize(timingFn(progress), 0, 1, tMin, tMax);

          el.style.opacity = opacity;

          return { opacity };
        }.bind(this), duration)
          .then(function() { resolve(el) });
      }
    }.bind(this));
  };

  /**
  * Get bounding client rectangle from cache, or retrieve it and cache it for future use
  * @private
  * @param {HTMLElement} el
  * @returns {DOMRect} - Bounding client rectangle of the element
  */
  Nav.prototype.getBoundingClientRect = function(el) {
    if (this.cachedElements.has(el)) {
      return this.cachedElements.get(el);
    }

    var rect = el.getBoundingClientRect();

    this.cachedElements.set(el, rect);

    return rect;
  };

  /**
  * Animate the element
  * @private
  * @param {HTMLElement} el - HTML element that we are animating
  * @param {function(number, number):void} callback - Called in each frame
  * @param {number} duration - Duration of animation in ms
  * @returns {Promise}
  */
  Nav.prototype.animate = function(el, callback, duration) {
    return new Promise(function(resolve) {
      var startTime;

      var animate = function(timestamp) {
        startTime = startTime || timestamp;
        var timeElapsed = timestamp - startTime;
        var progress = Math.min(timeElapsed / duration, 1);

        var props = callback(progress, timeElapsed) || {};

        if (progress !== 1) {
          var id = requestAnimationFrame(animate);
          this.activeAnimations.set(el, { id, timeElapsed, props });
        } else {
          this.activeAnimations.delete(el);

          resolve(el);
        }
      }.bind(this);

      var id = requestAnimationFrame(animate);
      this.activeAnimations.set(el, { id, timeElapsed: 0, props: {} });
    }.bind(this));
  };

  /**
  * Cancel javascript animation
  * @private
  * @param {HTMLElement} el - HTML element that we are animating
  * @returns {Object} - Animation object { id, timeElapsed } of removed element, or null
  */
  Nav.prototype.cancelAnimate = function(el) {
    if (!this.activeAnimations.has(el)) return null;

    var animation = this.activeAnimations.get(el);

    cancelAnimationFrame(animation.id);

    this.activeAnimations.delete(el);

    return animation;
  };

  /**
  * Normalize the number into the target range
  * @private
  * @param {number} m - Number to normalize
  * @param {number} rMin - Lower bound of m's range
  * @param {number} rMax - Upper bound of m's range
  * @param {number} tMin - Lower bound of target range
  * @param {number} tMax - Upper bound of target range
  * @returns {number} - Normalized number
  */
  Nav.normalize = function(m, rMin, rMax, tMin, tMax) {
    return ((m - rMin) / (rMax - rMin)) * (tMax - tMin) + tMin;
  };

  /**
  * Hide all open dropdowns
  * @private
  * @param  {HTMLElement} dropdown     Dropdown HTML element
  * @returns {void}
  */
  Nav.prototype.hideAllDropdowns = function() {
    this.navElement.querySelectorAll('.' + Nav.CLASS.DROPDOWN + '.' + Nav.CLASS.OPEN).forEach(function(openDropdown) {
      openDropdown.classList.remove(Nav.CLASS.OPEN);
      this.hideNavElement(this.constructor.findDropdownMenu(openDropdown));
    }.bind(this));
  };
})(window);