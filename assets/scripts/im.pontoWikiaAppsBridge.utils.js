define('im.pontoWikiaAppsBridge.utils', ['im.config'], function (config) {
	'use strict';

	/**
	 * @desc checks if target is valid link to article
	 * @param {Element} target - HTML node element
	 * @returns {Element|null} - if no valid article link element exist returns null
	 */
	function getArticleLinkEl(target) {
		var link;

		if (target.tagName === 'A' && target.className.indexOf(config.articleLinkClassName) !== -1) {
			link = target;
		} else if (
			target.tagName === 'IMG' &&
			target.parentNode.className.indexOf(config.articleLinkClassName) !== -1
		) {
			link = target.parentNode;
		} else {
			link = null;
		}

		return link;
	}

	return {
		getArticleLinkEl: getArticleLinkEl
	};
});
