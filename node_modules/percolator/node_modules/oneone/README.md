# oneone
[![Build
Status](https://secure.travis-ci.org/cainus/oneone.png?branch=master)](http://travis-ci.org/cainus/oneone)
[![Coverage Status](https://coveralls.io/repos/cainus/oneone/badge.png?branch=master)](https://coveralls.io/r/cainus/oneone)
[![NPM version](https://badge.fury.io/js/oneone.png)](http://badge.fury.io/js/oneone)

oneone is an http server library for node.js that aims to more completely support http 1.1  

It has only a few simple goals:
* make basic RFC2616 features as easy as possible.
* don't alter core node classes where possible (esp. request and response
  objects)
* handle routing
* make extension possible and easy

It should be possible to use oneone as the basis of a framework. 

### A Hello World Example:
```javascript
var Server = require('oneone');

var server = new Server(8080);

server.onRequest(function(handler, context, cb){
  console.log(' <-- ', context.req.method, ' ', context.req.url);
  cb(null, context);
});

server.route('/hello', { GET : function($){ 
                                 console.log("hideyho");
                                 $.res.end("hideyho"); 
                               }
                        });

server.listen(function(err){
  if (err) {console.log(err);throw err;}
  console.log(server.router.routes);
  console.log('Server running on ' + server.port);
});
```

## Automated Tests:
npm test
