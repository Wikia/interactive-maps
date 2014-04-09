describe('Logger module', function () {
	var proxyquire = require('proxyquire'),
		logger = proxyquire('./../lib/logger.js', {
			'fs': {
				createWriteStream: createWriteStream
			},
			'node-syslog': {
				init: function () {
					counter++;
				},
				log: function () {
					counter++;
				}
			}
		}),
		counter = 0,
		consoleLog = console.log;

	console.log = function (message) {
		counter++;
	};

	function createWriteStream(path) {
		counter++;
		return {
			path: path,
			write: function (message) {
				counter++
			},
			end: function () {}
		};
	}

	it('should exist', function () {
		expect(logger).toBeDefined();
	});

	it('should have all the methods defined', function () {
		expect(typeof logger.debug).toBe('function');
		expect(typeof logger.info).toBe('function');
		expect(typeof logger.notice).toBe('function');
		expect(typeof logger.warning).toBe('function');
		expect(typeof logger.error).toBe('function');
		expect(typeof logger.critical).toBe('function');
		expect(typeof logger.alert).toBe('function');
		expect(typeof logger.emergency).toBe('function');
		expect(typeof logger.reset).toBe('function');
		expect(typeof logger.set).toBe('function');
		expect(typeof logger.close).toBe('function');
		expect(typeof logger.middleware).toBe('function');
	});

	it('should export severity levels', function () {
		expect(typeof logger.level.DEBUG).toBe('number');
		expect(typeof logger.level.INFO).toBe('number');
		expect(typeof logger.level.NOTICE).toBe('number');
		expect(typeof logger.level.WARNING).toBe('number');
		expect(typeof logger.level.ERROR).toBe('number');
		expect(typeof logger.level.CRITICAL).toBe('number');
		expect(typeof logger.level.ALERT).toBe('number');
		expect(typeof logger.level.EMERGENCY).toBe('number');
	});

	it('Should use console.log when it has console transport set', function () {
		spyOn(console, 'log');
		logger.set({
			console: {
				enabled: true,
				level: logger.level.DEBUG,
				raw: true
			}
		});
		logger.debug('Console test');
		logger.close();
		expect(console.log).toHaveBeenCalled();
	});

	it('Should filter unwanted severity levels', function () {
		spyOn(console, 'log');
		logger.set({
			console: {
				enabled: true,
				level: logger.level.INFO
			}
		});
		logger.debug('Console test');
		logger.close();
		expect(console.log).not.toHaveBeenCalled();
	});

	it('Should open and write to stream (2 ops) when logging to a local file', function () {
		counter = 0;

		logger.set({
			file: {
				enabled: true,
				level: logger.level.DEBUG,
				path: 'test.log'
			}
		});
		logger.debug('Testing');
		logger.close();

		expect(counter).toEqual(2);
	});

	it('Should open syslog connection and write to it (2 ops) when syslog enabled', function () {
		counter = 0;

		logger.set({
			syslog: {
				enabled: true,
				level: logger.level.DEBUG
			}
		});
		logger.debug('Testing');
		logger.close();

		expect(counter).toEqual(2);
	});

	it('should expose getContext method', function () {
		expect(logger.getContext).toBeDefined();
		expect(typeof logger.getContext).toBe('function');
	});

	it('getContext should return context', function () {
		expect(logger.getContext({
			url: 'url',
			method: 'GET',
			ip: '127.0.0.1',
			hostname: 'test.com',

		}, 200, 4)).toEqual({
			clientip: '127.0.0.1',
			hostname: 'test.com',
			verb: 'GET',
			url: 'url',
			response: 200,
			processTime: 4
		});

		expect(logger.getContext({
			url: 'url',
			method: 'POST',
			ip: '127.0.0.1',
			hostname: 'test.com',
		}, 200, 4)).toEqual({
			clientip: '127.0.0.1',
			hostname: 'test.com',
			verb: 'POST',
			url: 'url',
			response: 200,
			processTime: 4
		});

		expect(logger.getContext({
			url: 'url2',
			method: 'GET',
			ip: '127.0.0.1',
			hostname: 'test.com',
		}, 200, 4)).toEqual({
			clientip: '127.0.0.1',
			hostname: 'test.com',
			verb: 'GET',
			url: 'url2',
			response: 200,
			processTime: 4
		});

		expect(logger.getContext({
			url: 'url3',
			method: 'POST',
			ip: '127.0.0.1',
			hostname: 'test.com',
		}, 400, 4)).toEqual({
			clientip: '127.0.0.1',
			hostname: 'test.com',
			verb: 'POST',
			url: 'url3',
			response: 400,
			processTime: 4
		});

		expect(logger.getContext({
			url: 'url4',
			method: 'DELETE',
			ip: '127.0.0.1',
			hostname: 'test.com',
		}, 600, 45)).toEqual({
			clientip: '127.0.0.1',
			hostname: 'test.com',
			verb: 'DELETE',
			url: 'url4',
			response: 600,
			processTime: 45
		});
	});

	console.log = consoleLog;

	it('Should log middleware req/res details', function () {
		spyOn(console, 'log');

		function done() {}
		var req = {
			ip: '127.0.0.1',
			hostname: 'hostname',
			method: 'GET',
			path: '/'
		},
			res = {
				statusCode: 200,
				on: function (event, method) {
					//to call the method once, not twice
					if (event !== 'close') {
						method();
					}
				}
			};

		logger.set({
			console: {
				enabled: true,
				level: logger.level.DEBUG
			}
		});
		logger.middleware(req, res, done);
		expect(console.log).toHaveBeenCalled();
		logger.close();
	});

});
