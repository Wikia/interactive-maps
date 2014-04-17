'use strict';

describe('Get CRUDs', function() {

	var proxyquire = require('proxyquire').noCallThru(),
		configs,
		getCRUDs = proxyquire('./../lib/getCRUDs', {
			'fs': {
				readdirSync: function() {
					return configs;
				}
			}
		});

	/**
	 * @desc helper function that build array of config names
	 * @returns {array} - array of config names
	 */

	function getConfigs() {
		var configPaths = crudConfigs.getConfigs();

		return Object.keys(configPaths);
	}

	it('builds an array of API config modules', function() {
		var configNamesArray;

		configs = [
			'test1.config.js',
			'test2.config.js',
			'test3.blabla.config.js'
		];

		configNamesArray = getConfigs();

		expect(configNamesArray.length).toBe(3);
		expect(configNamesArray[0]).toBe('test1');
		expect(configNamesArray[1]).toBe('test2');
		expect(configNamesArray[2]).toBe('test3.blabla');
	});

	it('skips non config files', function() {
		var configNamesArray;

		configs = [
			'lorem.ispum.js',
			'blabla.js',
			'blabla.config.bla.js',
			'test123.config.js.bla'
		];
		configNamesArray = getConfigs();

		expect(configNamesArray.length).toBe(0);
	});
});
