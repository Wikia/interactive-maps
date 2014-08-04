'use strict';
define('im.i18n', function () {
	/**
	 * @desc Translates message
	 * @param {object} messages - JSON object with messages
	 * @param {string} msgKey - message key
	 * @returns {string}
	 */
	function msg(messages, msgKey) {
		return messages.hasOwnProperty(msgKey) ? messages[msgKey] : msgKey;
	}

	return {
		msg: msg
	};
});
