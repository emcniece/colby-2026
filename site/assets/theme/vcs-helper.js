/**
 * @file Helper functions
 * @copyright Copyright (C) 2019 Van City Studios {@link https://www.vancitystudios.com/}
 */

/**
 * Check if the object has given value
 * @param {Object} obj - Target object
 * @param {Object|Function|Number|String|Boolean} value - Value to look for
 * @returns {Boolean}
 */
function hasValue(obj, value) {
  return Object.values(obj).includes(value);
}

/**
* Get all the parents of a given element that match the selector
* @param {HTMLElement} el - HTMl element
* @param {string} selector - String containing the selector
* @returns {HTMLElement[]} - Array of parent HTML elements that match the selector
*/
function getParents(el, selector) {
  var parents = [];
  var p;

  for (p = el; p; p = p.parentElement) {
    if (p.matches(selector)) {
      parents.push(p);
    }
  }

  return parents;
}

/**
 * Get a number from the string
 * @param {string} str - Number in a string format (ex. '$4,450.78', '4,200.33', '4,200');
 * @returns {Number}
 */
function getNumber(str) {
  var results = /^[^\d+-]*[+-]?(([0-9]{1,3}(?:,[0-9]{3})*)(\.[0-9]+)?|\d*\.\d+|\d+)\D*$/.exec(str);

  if (results) {
    return results[1].replace(/,/g, '') * 1;
  }

  return 0;
}

/**
 * Returns a number string formatted with thousand separators
 * @param {number} x - Number to format
 * @returns {string}
 */
function numberWithCommas(x) {
  var parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Fetch a get parameter by name
 * @param {string} name - Name of the get parameter that we are looking for
 * @param {string} [url=window.location.href] - URL string that will be used for search
 * @returns {string|null} - Value of the supplied get parameter
 */
function getParameter(name, url) {
  url = url || window.location.href;

  var cleanedName = name.replace(/[[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + cleanedName + '(=([^&#]*)|&|#|$)');
  var results = regex.exec(url);

  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


/**
 * Determine whether a node's text content is entirely whitespace.
 * @param {Node} nod - A node implementing the |CharacterData| interface (i.e.,
 * a |Text|, |Comment|, or |CDATASection| node
 * @returns {boolean} - True if all of the text content of |nod| is whitespace,
 * otherwise false.
 */
function isAllWS(nod) {
  // Use ECMA-262 Edition 3 String and RegExp features
  return !(/[^\t\n\r ]/.test(nod.textContent));
}
