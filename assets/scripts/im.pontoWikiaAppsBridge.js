define('im.pontoWikiaAppsBridge', ['ponto', 'im.window', 'im.config'], function (ponto, w, tracker, config) {
	'use strict';

	var pontoWikiaAppClass = 'Linker',
		poiArticleLinkClass = 'poi-article-link',
		disabledLinkClass = 'disabled';

	/**
	 * @desc checks if map is embeded in native wikia app
	 * @param {function} success
	 * @param {function} error
	 */
	function isEmbededInWikiaApp(success, error) {
		ponto.invoke(pontoWikiaAppClass, 'isEmbeded', {}, success, error);
	}

	/**
	 * @desc sends link URL to native wikia app
	 * @param {Element} link
	 */
	function sendLinkUrl(link) {
		ponto.invoke(pontoWikiaAppClass, 'goTo', {
			url: link.href,
			title: link.dataset.articleTitle
		});
	}

	/**
	 * @desc setup POI article links for native wikia app
	 */
	function setupPoiLinks() {
		var links = w.document.getElementsByClassName(poiArticleLinkClass),
			host = config.mapConfig.city_url.replace(/^http\:\/\//, ''),
			i = links.length,
			link,
			path;

		while (i--) {
			link = links[i];
			path = link.pathname || link.href;

			if ((link.host && link.host !== host) || path === '/wikia.php') {
				link.className += ' ' + disabledLinkClass;
			}
		}
	}

	/**
	 * @desc prevents default link behavior and sends supported links to native wikia app for processing
	 */
	function bindLinkEvents() {
		var body = w.document.getElementsByTagName('body')[0];

		body.addEventListener('click', function (event) {
			var target = event.target;

			if(
				target.tagName === 'A' &&
				target.className.indexOf(poiArticleLinkClass) !== -1 &&
				target.className.indexOf(disabledLinkClass) === -1
			) {
				event.preventDefault();
				sendLinkUrl(target);
			}
		});
	}

	return {
		isEmbededInWikiaApp: isEmbededInWikiaApp,
		setupPoiLinks: setupPoiLinks,
		sendLinkUrl: sendLinkUrl,
		bindLinkEvents: bindLinkEvents
	};
});
