var _ = require('underscore');
var Server = require('./lib/Server');
var fs = require('fs');

var server = new Server({
  port : 8080, 
  protocol : 'http',
  //key: fs.readFileSync('./key.pem'),
  //cert: fs.readFileSync('./key-cert.pem')
});
server.onRequest(function(handler, context, cb){
  console.log(' <-- ', context.req.method, ' ', context.req.url);
  cb(null, context);
});

var resourceDir = __dirname + '/test/test_fixtures/resources';
server.staticRoute(__dirname + '/test/test_fixtures/static', function(){
  console.log("statically routed!");
});
server.routeDirectory(resourceDir, '/api', function(err){
  console.log("routed resources in " + resourceDir);

  server.route('/inside', 
                      { GET : function($){ 
                                console.log("hideyho");
                                $.res.end("muahahah!"); 
                              }
                      });

  if (err) {
    console.log("Routing error");
    console.log(err);
    return;
  }
  server.listen(function(err){
    if (err) {console.log(err);throw err;}
    console.log(server.router.routes);
    console.log('Server running on ' + server.port);
  });
});
