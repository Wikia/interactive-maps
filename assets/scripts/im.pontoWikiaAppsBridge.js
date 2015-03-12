define(
	'im.pontoWikiaAppsBridge',
	['ponto', 'im.window', 'im.pontoWikiaAppsBridge.utils'],
	function (ponto, w, utils) {
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
			var link = utils.getArticleLinkEl(event.target);

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
