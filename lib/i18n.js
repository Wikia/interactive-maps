'use strict';

var translations = require('../locales/translations.json').messages,
	config = require('./config'),
	defaultLanguage = config.defaultLanguage || 'en',
	keysLanguage = 'qqx',
	qqxCache;

// Failsafe check for broken translation file
console.assert(typeof translations === 'object', 'Translation is broken');

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
	if (language === keysLanguage) {
		if (typeof qqxCache !== 'undefined') {
			return qqxCache;
		}
		qqxCache = {};
		Object.keys(translations[defaultLanguage]).forEach(function (key) {
			qqxCache[key] = key;
		});
		return qqxCache;
	}
	return translations[defaultLanguage];
}

/**
 * Translate single message
 *
 * @param {string} message Message key to be translated
 * @param {string} language Language to use for translation
 * @param {array} optional message params to be replaced in the message
 * @returns {string}
 */
function translateMessage(message, language, params) {
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
			if (Array.isArray(params)) {
				params.forEach(function (value, index){
					result = result.replace('$' + (index+1), value);
				});
			}
			return result;
		}
	});
	return result;
}

function getLanguage(language) {
	if (typeof language === 'undefined') {
		return defaultLanguage;
	}
	if (translations.hasOwnProperty(language)) {
		return language;
	}
	if (language === keysLanguage) {
		return keysLanguage;
	}
	return defaultLanguage;
}

module.exports = {
	msg: translateMessage,
	getTranslations: getTranslations,
	getLanguage: getLanguage
};
