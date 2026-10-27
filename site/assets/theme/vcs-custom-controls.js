;(function(root) {

  /**
   * @file Provides functionality related to custom controls
   * @copyright Copyright (C) 2019 Van City Studios {@link https://www.vancitystudios.com/}
   */

  root.CustomControls = CustomControls;

  function CustomControls(forms) {
    forms = forms || document.getElementsByTagName('form') || [];

    // Add event listeners to each form
    Array.from(forms).forEach(function(form) {
      form.addEventListener('focusin', CustomControls.onFocusIn);
      form.addEventListener('focusout', CustomControls.onFocusOut);
      form.addEventListener('change', CustomControls.onChange);
    });

    var fieldSelector = '.form-control-material > input'
      + ', .form-control-material > textarea'
      + ', .form-control-material > select';

    document.querySelectorAll(fieldSelector).forEach(function(field) {
      CustomControls.onFocusOut({ target: field });
    });
  }

  /**
   * Custom control CSS class
   * @type {string}
   */
  CustomControls.CONTROL = 'form-control-material';

  /**
   * Custom control label CSS class
   * @type {string}
   */
  CustomControls.LABEL = 'floating-label';

  /**
   * Focus in event handler
   * @private
   * @param {Object} e
   */
  CustomControls.onFocusIn = function(e) {
    var control = e.target.parentElement;

    if (!control || !control.classList.contains(CustomControls.CONTROL)) return;

    control.classList.add(CustomControls.CONTROL + '--focused');

    var label = control.firstElementChild;

    if (label === e.target
      || label.tagName !== 'LABEL'
      || label.htmlFor !== e.target.id
      || !label.classList.contains(CustomControls.LABEL)
    ) return;

    label.classList.add(CustomControls.LABEL + '--float-above');
  };

  /**
   * Focus out event handler
   * @private
   * @param {Object} e
   */
  CustomControls.onFocusOut = function(e) {
    var control = e.target.parentElement;

    if (!control || !control.classList.contains(CustomControls.CONTROL)) return;

    control.classList.remove(CustomControls.CONTROL + '--focused');

    if (!e.target.value.match(/\S/)) {
      var label = control.firstElementChild;

      if (label === e.target
        || label.tagName !== 'LABEL'
        || label.htmlFor !== e.target.id
        || !label.classList.contains(CustomControls.LABEL)
      ) return;

      label.classList.remove(CustomControls.LABEL + '--float-above');
    }
  };

  /**
   * Change event handler
   * @private
   * @param {Object} e
   */
  CustomControls.onChange = function(e) {
    var control = e.target.parentElement;

    if (!control || !control.classList.contains(CustomControls.CONTROL)) return;

    var label = control.firstElementChild;

    if (label === e.target
      || label.tagName !== 'LABEL'
      || label.htmlFor !== e.target.id
      || !label.classList.contains(CustomControls.LABEL)
    ) return;

    label.classList.add(CustomControls.LABEL + '--float-above');
  };
})(window);
