var Server = require('./lib/Server');

var server = new Server();
server.routeDirectory(__dirname + '/resources', '/', function(err){
  if (!!err) {console.log(err);}
  server.listen(function(err){
    console.log('server is listening on port ', server.port);
  });
});
