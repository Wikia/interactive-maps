'use strict';

var Percolator = require('percolator').Percolator,
	connect = require('connect'),
	server = new Percolator({autoLink: false});

server.connectMiddleware( connect.logger({ format:'dev'}));

server.routeDirectory(__dirname + '/resources', '/api', function(err){
	if (!!err) {console.log(err);}
	server.listen(function(){
		console.log('server is listening on port ', server.port)
	});
});


