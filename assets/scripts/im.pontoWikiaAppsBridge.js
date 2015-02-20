define('im.pontoWikiaAppsBridge', ['ponto', 'im.window'], function (ponto, w) {
	'use strict';

	var pontoWikiaAppClass = 'Linker',
		poiArticleLinkClass = 'poi-article-link';

	/**
	 * @desc sends link URL to native wikia app
	 * @param {Element} link
	 */
	function sendLinkUrl(link) {
		ponto.invoke(pontoWikiaAppClass, 'goTo', {
			url: link.href,
			title: link.dataset.articleTitle.replace(/ /g, '_')
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
				target.tagName === 'A' &&
				target.className.indexOf(poiArticleLinkClass) !== -1
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
