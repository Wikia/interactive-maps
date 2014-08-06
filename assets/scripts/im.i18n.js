'use strict';

define('im.i18n', ['im.config'], function (config) {
	var messages = config.messages;

	/**
	 * @desc Translates message
	 * @param {string} msgKey - message key
	 * @returns {string}
	 */
	function msg(msgKey) {
		return messages.hasOwnProperty(msgKey) ? messages[msgKey] : msgKey;
	}

	return {
		msg: msg
	};
});
