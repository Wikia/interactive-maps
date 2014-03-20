'use strict';

var Percolator = require('percolator').Percolator,
	connect = require('connect'),
	server = new Percolator({autoLink: false});

var logger = require( './lib/logger.js' );

logger.init( { toFile : 4 } );

logger.notice( 'noticing' );

server.connectMiddleware(connect.logger({ format: 'dev'}));

logger.alert( 'alerting' );

logger.close();

server.routeDirectory(__dirname + '/resources', '/api', function (err) {
	if (!!err) {
		console.log(err);
	}
	server.listen(function () {
		console.log('server is listening on port ', server.port)
	});
});


