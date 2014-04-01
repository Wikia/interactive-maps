describe ( 'Logger module', function () {
	var proxyquire = require( 'proxyquire'),
		logger = proxyquire('./../lib/logger.js', {
			'fs' : {
				createWriteStream : createWriteStream
			},
			'node-syslog' : {
				init : function () {counter++;},
				log : function () {counter++;}
			}
		}),
		counter = 0,
		consoleLog = console.log;

	console.log = function ( message ) { counter++; };

	function createWriteStream (path) {
		counter++;
		return {
			path: path,
			write: function(message){counter++},
			end: function(){}
		};
	}

	it( 'should exist', function () {
		expect( logger ).toBeDefined();
	} );

	it( 'should have all the methods defined', function () {
		expect( typeof logger.debug ).toBe( 'function' );
		expect( typeof logger.info ).toBe( 'function' );
		expect( typeof logger.notice ).toBe( 'function' );
		expect( typeof logger.warning ).toBe( 'function' );
		expect( typeof logger.error ).toBe( 'function' );
		expect( typeof logger.critical ).toBe( 'function' );
		expect( typeof logger.alert ).toBe( 'function' );
		expect( typeof logger.emergency ).toBe( 'function' );
		expect( typeof logger.reset ).toBe( 'function' );
		expect( typeof logger.set ).toBe( 'function' );
		expect( typeof logger.close ).toBe( 'function' );
	} );

	it( 'should export severity levels', function () {
		expect( typeof logger.level.DEBUG ).toBe( 'number' );
		expect( typeof logger.level.INFO ).toBe( 'number' );
		expect( typeof logger.level.NOTICE ).toBe( 'number' );
		expect( typeof logger.level.WARNING ).toBe( 'number' );
		expect( typeof logger.level.ERROR ).toBe( 'number' );
		expect( typeof logger.level.CRITICAL ).toBe( 'number' );
		expect( typeof logger.level.ALERT ).toBe( 'number' );
		expect( typeof logger.level.EMERGENCY ).toBe( 'number' );
	} );

	it( 'Should use console.log when it has console transport set', function () {
		spyOn(console, 'log');
		logger.set( { console : {enabled: true, level : logger.level.DEBUG, raw: true} } );
		logger.debug( 'Console test' );
		logger.close();
		expect(console.log).toHaveBeenCalledWith('[DEBUG] Console test');
	} );

	it( 'Should filter unwanted level levels', function () {
		spyOn(console, 'log');
		logger.set( { console : {enabled: true, level : logger.level.INFO} } );
		logger.debug( 'Console test' );
		logger.close();
		expect(console.log).not.toHaveBeenCalled();
	} );

	it( 'Should open write stream when logging to a local file', function () {
		counter = 0;

		logger.set( { file : { enabled: true, level: logger.level.DEBUG, path: 'test.log' } } );
		logger.debug('Testing');
		logger.close();

		expect( counter ).toEqual(2);
	} );

	it( 'Should make an attempt to open syslog connection when syslog enabled', function () {
		counter = 0;

		logger.set( { syslog : { enabled: true, level: logger.level.DEBUG } } );
		logger.debug('Testing');
		logger.close();

		expect( counter ).toEqual(2);
	} );

	console.log = consoleLog;

} );