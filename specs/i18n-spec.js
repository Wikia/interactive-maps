'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	translations = {
		messages: {
			en: {
				test1: 'en_test1',
				test2: 'en_test2'
			},
			de: {
				test1: 'de_test1'
			}
		}
	},
	i18n = proxyquire('../lib/i18n', {
		'../locales/translations.json': translations,
		'./config': {
			defaultLanguage: 'en'
		}
	});

describe('i18n', function () {

	it('gets all the translations for defined language', function () {
		var testCases = [
			'en',
			'de'
		];
		testCases.forEach(function (testCase) {
			expect(i18n.getTranslations(testCase)).toEqual(translations.messages[testCase]);
		});
	});

	it('translates messages', function () {
		var testCases = [{
			key: 'test2',
			language: 'de',
			expected: 'en_test2'
		},{
			key: 'test1',
			language: 'en',
			expected: 'en_test1'
		},{
			key: 'test1',
			language: 'de',
			expected: 'de_test1'
		},{
			key: 'key-test12',
			language: 'de',
			expected: 'key-test12'
		},{
			key: 'test1',
			language: 'fr',
			expected: 'en_test1'
		},{
			key: 'test_key',
			language: 'qqx',
			expected: 'test_key'
		}];
		testCases.forEach(function (testCase) {
			expect(i18n.msg(testCase.key, testCase.language)).toEqual(testCase.expected);
		});
	});

	it('throws error if the language is not provided', function () {
		expect(function () {
			i18n.msg('test');
		}).toThrow('Translation language not set');
	});

	it('returns correct language for getLanguage', function () {
		var testCases = [{
			language: 'en',
			expected: 'en'
		},{
			language: 'de',
			expected: 'de'
		},{
			language: 'fr',
			expected: 'en'
		},{
			expected: 'en'
		}];
		testCases.forEach(function (testCase) {
			expect(i18n.getLanguage(testCase.language)).toEqual(testCase.expected);
		});
	});
});
