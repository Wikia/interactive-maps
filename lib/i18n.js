'use strict';

var translations = require('../locales/translations.json').messages,
	config = require('./config'),
	defaultLanguage = config.defaultLanguage || 'en';

/**
 * Get translations for language
 * @param {string} language
 * @returns {object}
 */
function getTranslations(language) {
	language = language || defaultLanguage;
	if (translations.hasOwnProperty(language)) {
		return translations[language];
	}
	return translations[defaultLanguage];
}

/**
 * Translate single message
 *
 * @param {string} message Message key to be translated
 * @param {string} language Language to use for translation
 * @returns {string}
 */
function translateMessage(message, language) {
	var result = message,
		languageMessages;

	if (typeof language === 'undefined') {
		throw 'Translation language not set';
	}
	// Try first the set language then fallback to default language
	[language, defaultLanguage].some(function (language) {
		languageMessages = getTranslations(language);
		if (languageMessages.hasOwnProperty(message)) {
			result = languageMessages[message];
			return result;
		}
	});
	return result;
}

module.exports = {
	message: translateMessage,
	getTranslations: getTranslations
};
