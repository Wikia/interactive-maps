'use strict';

process.env = {
	WIKIA_CONFIG_ROOT: 'test',
	WIKIA_SWIFT_YML: 'test',
	WIKIA_PROD_DATACENTER: 'test',
	NODE_ENV: 'test'
};

var proxyquire = require('proxyquire').noCallThru(),
	configuration = {
		tmp: '/tmp/',
		wgFSSwiftConfig: {
			test: ''
		}
	},
	config = proxyquire('../lib/config', {
		'js-yaml': {
			safeLoad: function(yaml){
				return yaml;
			}
		},
		'fs': {
			readFileSync: function(){
				return configuration;
			}
		},
		'./logger': {
			debug: function(){

			}
		}
	});

describe('config', function () {

	it('should throw an error on read failure', function () {
		expect( function(){
			proxyquire('../lib/config', {
				'js-yaml': {
					safeLoad: function(yaml){
						return yaml;
					}
				},
				'fs': {
					readFileSync: function(){
						throw 'test';
					}
				}
			});
		}).toThrow('Problem with config: test');
	});

	it('should read configuration', function () {
		expect(config).toBe(configuration);
	});

	it('should allow to set root', function () {
		expect(config.setRoot).toBeDefined();
		expect(typeof config.setRoot).toBe('function');

		expect(config.tmp).toEqual('/tmp/');

		config.setRoot('rootpath');
		expect(config.tmp).toEqual('rootpath/tmp/');
		expect(config.root).toEqual('rootpath');
	});
});
