define('im.pontoWikiaAppsBridge', ['ponto', 'im.window', 'im.config'], function (ponto, w, config) {
	'use strict';

	var pontoWikiaAppClass = 'Linker';

	/**
	 * @desc sends link URL to native wikia app
	 * @param {Element} link
	 */
	function sendLinkUrl(link) {
		var title = link.dataset.articleTitle;

		ponto.invoke(pontoWikiaAppClass, 'goTo', {
			url: link.href,
			title: title ? title.replace(/ /g, '_') : ''
		});
	}

	/**
	 * @desc checks if target is valid link to article
	 * @param {Element} target - HTML node element
	 * @returns {Element|Boolean} - if no valid article link element exist returns false
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
			link = false;
		}

		return link;
	}

	/**
	 * @desc prevents default link behavior and sends supported links to native wikia app for processing
	 */
	function setupArticleLinks() {
		var body = w.document.getElementsByTagName('body')[0];

		body.addEventListener('click', function (event) {
			var link = getArticleLinkEl(event.target);

			if (link) {
				event.preventDefault();
				sendLinkUrl(link);
			}
		});
	}

	return {
		setupArticleLinks: setupArticleLinks
	};
});
