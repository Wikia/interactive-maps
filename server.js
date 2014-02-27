'use strict';

var Percolator = require( 'percolator' ).Percolator,
	connect = require( 'connect' ),
    jade = require( 'connect-jade' ),
	server = new Percolator( {autoLink: false} );

server.connectMiddleware( connect.logger( {format:'dev'} ) );
server.connectMiddleware( jade( {
    root: __dirname + "/views",
    debug: true,
    defaults: {
        title: "No title",
        keywords: "node, connect, jade, template"
    }
}));


server.routeDirectory(__dirname + '/resources', '/api', function(err){
	if (!!err) {console.log(err);}
	server.listen(function(){
		console.log('server is listening on port ', server.port)
	});
});


