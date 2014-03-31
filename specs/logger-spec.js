describe ( 'Tests suite for logger', function () {
	var logger = require( './../lib/logger.js'),
		counter = 0,
		consoleLog = console.log;

	console.log = function () { counter++; }

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
		expect( typeof logger.init ).toBe( 'function' );
		expect( typeof logger.reset ).toBe( 'function' );
		expect( typeof logger.set ).toBe( 'function' );
		expect( typeof logger.close ).toBe( 'function' );
	} );

	it( 'should export severity levels', function () {
		expect( typeof logger.severity.DEBUG ).toBe( 'number' );
		expect( typeof logger.severity.INFO ).toBe( 'number' );
		expect( typeof logger.severity.NOTICE ).toBe( 'number' );
		expect( typeof logger.severity.WARNING ).toBe( 'number' );
		expect( typeof logger.severity.ERROR ).toBe( 'number' );
		expect( typeof logger.severity.CRITICAL ).toBe( 'number' );
		expect( typeof logger.severity.ALERT ).toBe( 'number' );
		expect( typeof logger.severity.EMERGENCY ).toBe( 'number' );
	} );

	it( 'Should use console.log when it has console transport set', function () {
		counter = 0;

		logger.init( { toConsole : logger.severity.DEBUG } );
		logger.debug( 'Console test' );
		logger.info( 'Console test');
		logger.notice( 'Console test' );
		logger.warning( 'Console test');
		logger.error( 'Console test' );
		logger.critical( 'Console test');
		logger.alert( 'Console test' );
		logger.emergency( 'Console test');
		logger.close();

		expect( counter ).toEqual( 8 );
	} );

	it( 'Should filter unwanted severity levels', function () {
		counter = 0;

		logger.set( { toConsole : logger.severity.WARNING } );
		logger.debug( 'Console test' );
		logger.info( 'Console test');
		logger.notice( 'Console test' );
		logger.warning( 'Console test');
		logger.error( 'Console test' );
		logger.critical( 'Console test');
		logger.alert( 'Console test' );
		logger.emergency( 'Console test');
		logger.close();

		expect( counter ).toEqual( 5 );
	} );

	it( 'Should open write stream when logging to a local file', function () {
		counter = 0;
		function createWriteStream (file) {
			counter++;
		}
		var	fs = proxyquire('fs', {createWriteStream : createWriteStream});
		logger.set( { toFile : { enabled: true, level: logger.severity.DEBUG } } );
		logger.debug('Testing');

		expect(counter).toEqual(1);
	} );

	console.log = consoleLog;

} );
