var Server = require('./lib/Server');

var server = new Server();
server.route('/', {  GET : function($){
                              $.res.end("Hello World!");
                            }});
server.listen(function(err){
  console.log('server is listening on port ', server.port);
});
