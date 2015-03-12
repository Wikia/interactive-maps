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
	 * @desc prevents default link behavior and sends supported links to native wikia app for processing
	 */
	function setupArticleLinks() {
		var body = w.document.getElementsByTagName('body')[0];

		body.addEventListener('click', function (event) {
			var target = event.target;

			if (
				target.tagName === 'A' || target.tagName === 'IMG' &&
				target.className.indexOf(config.articleLinkClassName) !== -1 ||
				target.parentNode.className.indexOf(config.articleLinkClassName) !== -1
			) {

				event.preventDefault();
				sendLinkUrl(target);
			}
		});
	}

	return {
		setupArticleLinks: setupArticleLinks
	};
});
