define('im.pontoWikiaBridge', ['ponto', 'im.window', 'tracker', 'im.config'], function (ponto, w, tracker, config) {
	'use strict';

	/**
	 * @desc shows error message for ponto communication
	 * @param {string} message - error message
	 * @todo figure out were to display them
	 */
	function showPontoError(message) {
		if (w.console) {
			w.console.error('Ponto Error', message);
		}
	}

	/**
	 * @desc post message to Wikia client using ponto
	 * @param {string} method - name of Wikia client ponto bridge module method which will process message
	 * @param {object} params - message content
	 * @param {function} callback - callback function triggered by Wikia client ponto bridge module
	 * @param {boolean} asynch - optional flag indicating if ponto should post message asynchronously (default = true)
	 */
	function postMessage(method, params, callback, asynch) {
		ponto.invoke(config.pontoBridgeModule, method, params, function (data) {
			callback(data);
		}, showPontoError, asynch);
	}

	return {
		showPontoError: showPontoError,
		postMessage: postMessage
	};
});
