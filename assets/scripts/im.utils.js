'use strict';

define('im.utils', function () {
	/**
	 * @desc Adds a class to an element
	 * @param {HTMLElement} element
	 * @param {string} className
	 */
	function addClass(element, className) {
		if (element.className.indexOf(className) === -1) {
			element.className += ' ' + className;
		}
	}

	/**
	 * @desc Removes a class from an element
	 * @param {HTMLElement} element
	 * @param {string} className
	 */
	function removeClass(element, className) {
		var regexp = new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g');
		element.className = element.className.replace(regexp, '');
	}

	/**
	 * @desc Adds or removes class of DOM element
	 * @param {Element} element - DOM element
	 * @param {string} className - Name of class to toggle
	 */
	function toggleClass(element, className) {
		var classList = element.className;
		if (classList.indexOf(className) !== -1) {
			removeClass(element, className);
		} else {
			addClass(element, className);
		}
	}

	/**
	 * @desc Converts size to maximal zoom level
	 * @param {number} size - maximal size length
	 * @returns {number} - maximal zoom level
	 */
	function sizeToZoomLevel(size) {
		return Math.ceil(Math.log(size) / Math.log(2)) - 8;
	}

	/**
	 * @desc Calculates minimum zoom level for map given the max viewport size
	 *
	 * Because generally map images are downscaled from the original image, which is rarely with the "correct" size,
	 * This function takes into account this fact and calculates the ratio between the original and ideal image size
	 * then multiplies the ratio to the maximal viewport size and gets the minimum zoom level for the compensated
	 * vieport size
	 *
	 * @param {number} maxZoom - maximal zoom level for the map
	 * @param {number} maxSize - max size of the image
	 * @param {number} maxViewPortSize - maximum viewport size
	 * @returns {number} - minimal zoom level
	 */
	function getMinZoomLevel(maxZoom, maxSize, maxViewPortSize) {
		var maxSizeForZoom = Math.pow(2, maxZoom + 8),
			ratio = maxSize / maxSizeForZoom,
			compensatedViewPortSize = maxViewPortSize / ratio;
		return Math.min(sizeToZoomLevel(compensatedViewPortSize), maxZoom);
	}

	return {
		addClass: addClass,
		removeClass: removeClass,
		toggleClass: toggleClass,
		sizeToZoomLevel: sizeToZoomLevel,
		getMinZoomLevel: getMinZoomLevel
	};
});
