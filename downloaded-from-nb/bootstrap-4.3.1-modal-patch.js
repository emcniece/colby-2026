// Bootstrap 4.3.1 Modal Focus Trap Patch
(function() {
    var Modal = $.fn.modal.Constructor;

    Modal.prototype._enforceFocus = function() {
      var that = this;

      $(document).off('focusin.bs.modal').on('focusin.bs.modal', function(e) {
        if (document !== e.target &&
            that._element !== e.target &&
            $(that._element).has(e.target).length === 0) {
          that._element.focus();
        }
      });

      $(this._element).off('keydown.bs.modal.tab').on('keydown.bs.modal.tab', function(e) {
        if (e.key === 'Tab' || e.keyCode === 9) {
          var focusableElements = $(that._element)
            .find('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
            .filter(':visible')
            .get();

          if (focusableElements.length === 0) return;

          var currentIndex = focusableElements.indexOf(document.activeElement);
          var nextIndex;

          if (e.shiftKey) {
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
          } else {
            nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
          }

          focusableElements[nextIndex].focus();
          e.preventDefault();
        }
      });
    };
  })();