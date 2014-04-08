'use strict';

describe('Get CRUD Configs', function() {

	var proxyquire = require('proxyquire').noCallThru(),
		configs,
		getCrudConfigs = proxyquire('./../lib/getCurdConfigs', {
			'fs': {
				readdirSync: function() {
					return configs;
				}
			}
		});

	it('builds an array of API config modules', function() {
		configs = [
			'test1.config.js',
			'test2.config.js',
			'test3.blabla.config.js'
		];

		var configModules = getCrudConfigs('test');

		console.log(configModules);
	});

	it('skips non config files', function() {
		configs = [
			'lorem.ispum.js',
			'blabla.js',
			'blabla.config.bla.js',
			'test123.config.js.bla'
		]
	});

});