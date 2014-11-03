'use strict';

process.env = {
	WIKIA_CONFIG_ROOT: 'test',
	WIKIA_SWIFT_YML: 'test',
	WIKIA_DATACENTER: 'test',
	NODE_ENV: 'test'
};

var proxyquire = require('proxyquire').noCallThru(),
	configuration = {
		tmp: '/tmp/',
		wgFSSwiftDC: {
			test: {
				test: {
					servers: [
						'127.0.0.1:80'
					]
				}
			}
		},
		wgTaskBroker: {
			dev: ''
		},
		api: {
			test: {
				port: 123,
				token: 'XYZ'
			}
		},
		db: {
			test: {}
		},
		client: {
			test: {}
		}
	},
	envMock = {
		WIKIA_CONFIG_ROOT: 'test',
		WIKIA_DATACENTER: 'test',
		NODE_ENV: 'test'
	},
	config = proxyquire('../lib/config', {
		'js-yaml': {
			safeLoad: function (yaml) {
				return yaml;
			}
		},
		'fs': {
			readFileSync: function () {
				return configuration;
			}
		},
		'./logger': {
			debug: function () {

			}
		},
		'./utils': {
			getProcessEnv: function () {
				return envMock;
			}
		},
		'test/InteractiveMapsConfig.json': configuration
	});

describe('config', function () {

	it('should throw an error on read failure', function () {
		expect(function () {
			proxyquire('../lib/config', {
				'js-yaml': {
					safeLoad: function (yaml) {
						return yaml;
					}
				},
				'fs': {
					readFileSync: function () {
						throw 'test';
					}
				}
			});
		}).toThrow('Problem with config: Error: Cannot find module \'test/InteractiveMapsConfig.json\'');
	});

	it('should read configuration', function () {
		expect(config).toBe(configuration);
	});

	it('should allow to set root', function () {
		expect(config.setRoot).toBeDefined();
		expect(typeof config.setRoot).toBe('function');

		expect(config.tmp).toEqual('/tmp/');

		config.setRoot('rootpath');
		expect(config.tmp).toEqual('/tmp/');
		expect(config.root).toEqual('rootpath');
	});
});
