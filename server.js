'use strict';

var Percolator = require('percolator').Percolator,
	connect = require('connect'),
	server = new Percolator({autoLink: false});

var logger = require( './lib/logger.js' );

logger.init(
	{
		toFile : logger.severity.DEBUG,
		toConsole : logger.severity.DEBUG,
		toSyslog : logger.severity.WARNING,
		//raw : true
	}
);

logger.notice( 'noticing' );

logger.debug('debugging');

logger.alert('alerting');

logger.warning('warning', {something: 'something'});

server.connectMiddleware(connect.logger({ format: 'dev'}));

logger.info( 'infoing' );

logger.close();

server.routeDirectory(__dirname + '/resources', '/api', function (err) {
	if ( !!err ) {
		console.log( err );
	}
	server.listen(function () {
		console.log('server is listening on port ', server.port)
	});
});


