;(function() {
  var patterns = document.querySelectorAll('.pattern');

  if (! patterns.length) return;

  var computedStyles = window.getComputedStyle(patterns[0]);
  var bgColor = rgb2hex(computedStyles.getPropertyValue('background-color'));
  var fillColor = LightenColor(rgb2hex(bgColor), .2);

  patterns.forEach(function(pattern) {
    var bgImage = pattern.style.backgroundImage;

    bgImage.replace('fill="%23ffffff', 'fill="%23' + fillColor);

    pattern.style.backgroundImage = bgImage;
  });

  /**
   * Converts RGB color value to hex
   * @param {string} rgb
   * @returns {string} - Hex value
   */
  function rgb2hex(rgb) {
    var match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);

    if (! match) {
      return rgb;
    }

    function hex(x) {
        return ('0' + parseInt(x).toString(16)).slice(-2);
    }

    return '#' + hex(match[1]) + hex(match[2]) + hex(match[3]);
  }

  /**
   * Returns a lighter version of hex color
   * @param {string} color - Hex value of the color
   * @param {number} percent - Percentage for which to lighten the color
   * @returns {string}
   */
  function LightenColor(color, percent) {
    var num = parseInt(color.replace('#',''), 16);
		var amt = Math.round(2.55 * percent);
		var R = (num >> 16) + amt;
		var B = (num >> 8 & 0x00FF) + amt;
		var G = (num & 0x0000FF) + amt;

		return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
  }
})();