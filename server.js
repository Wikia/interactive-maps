'use strict';

var Percolator = require('percolator').Percolator,
	connect = require('connect'),
	server = new Percolator({autoLink: false}),
	logger = require( './lib/logger.js' );

logger.init({file:{enable: true, level: 7, raw: true}});

//logger.debug( 'hello' );
logger.set({syslog:{enable: true, level: 7, tag: 'hejka'}});

logger.notice('noticing');

logger.set({syslog:{enable: false}});

logger.error('erroring');

logger.close();

/*server.connectMiddleware(connect.logger({ format: 'dev'}));

var Syslog = require('node-syslog');

console.log(Syslog.LOG_PID);
Syslog.init("node-syslog-test", Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0);
Syslog.log(Syslog.LOG_INFO, "news info log test");
Syslog.log(Syslog.LOG_ERR, "news log error test");
Syslog.log(Syslog.LOG_EMERG, "Last log message as emergency: " + new Date());
Syslog.close();

server.routeDirectory(__dirname + '/resources', '/api', function (err) {
	if ( !!err ) {
		console.log( err );
	}
	server.listen(function () {
		console.log('server is listening on port ', server.port);
	});
});

*/


