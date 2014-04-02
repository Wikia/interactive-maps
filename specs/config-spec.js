'use strict';

var proxyquire = require('proxyquire').noCallThru(),
	configuration = {
		tmp: '/tmp/'
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
		'./../settings': {
			configPath: 'path'
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
				},
				'./../settings': {
					configPath: 'path'
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
