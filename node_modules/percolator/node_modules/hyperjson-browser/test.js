var index = require('./');
var http = require('http');

http.createServer(function (req, res) {
  index('util', 'api')(req, res, function(){
    res.end("missed it.");
  });
}).listen(1337, '127.0.0.1');
