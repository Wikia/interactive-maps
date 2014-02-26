# Json-Status
[![Build
Status](https://secure.travis-ci.org/cainus/json-status.png?branch=master)](http://travis-ci.org/cainus/json-status)
[![Coverage Status](https://coveralls.io/repos/cainus/json-status/badge.png?branch=master)](https://coveralls.io/r/cainus/json-status)
[![NPM version](https://badge.fury.io/js/json-status.png)](http://badge.fury.io/js/json-status)
[![Size](http://wapiti.io/api/sizeBadges/json-status)](http://wapiti.io/api/sizeBadges/json-status)

Json-status is a node.js library that makes JSON status and error
messages simpler and more consistent.

##Installation
```
npm install json-status --save
```

##Setup as connect middleware
```javascript
  var JsonStatus = require('json-status');
  var connect = require('connect');
  var server = connect.createServer();
  var responseSent = false;
  var errorEventSent = false;
  var statusMiddleware = JsonStatus.connectMiddleware('status', function(data){
    console.log("error: ", data.type, data.message, data.detail);
  });
  server.use(statusMiddleware);
  server.use(function(req, res){
    res.status.internalServerError("fake error!");  // this will respond with a 500
  });
```

##No frills setup
```javascript
  var JsonStatus = require('json-status');
  var http = require('http');
  http.createServer(function (req, res) {
    new JsonStatus(req, res).internalServerError("fake error too!");
  }).listen(1337, '127.0.0.1');

```

##Usage
To understand what the HTTP status codes mean, please refer to <a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html">http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html</a>.

These methods generally set the HTTP status and end the response, so in general you should 
not expect to write more to the response after these. If a response body makes sense, it 
will generally be written automatically. For clarity, it's recommended that when you call 
one of these functions, you call it with `return` in front of it. Here's an example:

```javascript
server.route('/', {  GET : function(req, res){
                              return res.status.redirect('/someOtherUrl');
                            }});
```

Here are the functions that it makes available in your method handler:


###Redirect scenarios
####res.status.created(redirectUrl);
This method is used for HTTP STATUS 201 scenarios when the server has just created a resource successfully so that the server can tell the client where to find it. It sets the status to 201 and sets the 'Location' header to the redirectUrl.

####res.status.movedPermanently(redirectUrl);
This method is used for HTTP STATUS 301 scenarios where a resource has been permanently moved somewhere else so the server can tell the client where to find it. It sets the status to 301 and sets the 'Location' header to the redirectUrl.

####res.status.redirect(redirectUrl);
This is just an alias of movedPermanently()

###Success responses

"200 OK" statuses are the default, so you don't need to specify those explicitly.

201 Created statuses are described in the redirect section above.


####res.status.accepted();

Used to indicate that a response has been accepted, but not yet processed, this response will emit a "202 Accepted" status.

####res.status.noContent();
Used to indicate that a request was successful, but there's no body to return (for example, a successful DELETE).  This response will emit a "204 No Content" status.

####req.status.resetContent();

Used to indicate that a request was sucessful so a related UI (usually a form) should clear its content.  This response will emit a "205 Reset Content" status.


###Error Scenarios
All of the error scenarios are handled similarly and attempt to show a response body that indicates the error that occurred as well. The status code will be set on the response as well as in that response body.

All of these methods additionally take a single parameter where additional detail information can be added. For example:

```javascript
server.route('/', {  GET : function(req, res){
                              return res.status.internalServerError('The server is on fire.');
                            }});
```

Output:
```javascript
{"type":500,"message":"Internal Server Error","detail":"The server is on fire"}
```

###Error response methods:

####res.status.badRequest([detail])
```javascript
{"type":400,"message":"Bad Request"}
```

####res.status.unauthenticated([detail])
```javascript
{"type":401,"message":"Unauthenticated"}
```

####res.status.forbidden([detail])
```javascript
{"type":403,"message":"Forbidden"}
```

####res.status.notFound([detail])
```javascript
{"type":404,"message":"Not Found"}
```

####res.status.methodNotAllowed([detail])
```javascript
{"type":405,"message":"Method Not Allowed"}
```

####res.status.notAcceptable([detail])
```javascript
{"type":406,"message":"Not Acceptable"}
```

####res.status.conflict([detail])
```javascript
{"type":409,"message":"Conflict"}
```

####res.status.gone([detail])
```javascript
{"type":410,"message":"Gone"}
```

####res.status.lengthRequired([detail])
```javascript
{"type":411,"message":"Length Required"}
```

####res.status.preconditionFailed([detail])
```javascript
{"type":412,"message":"Precondition Failed"}
```

####res.status.requestEntityTooLarge([detail])
```javascript
{"type":413,"message":"'Request Entity Too Large"}
```

####res.status.requestUriTooLong([detail])
```javascript
{"type":414,"message":"Request URI Too Long"}
```

####res.status.unsupportedMediaType([detail])
```javascript
{"type":415,"message":"Unsupported Media Type"}
```

####res.status.unprocessableEntity([detail])
```javascript
{"type":422,"message":"'Unprocessable Entity"}
```

####res.status.tooManyRequests([detail])
```javascript
{"type":429,"message":"Too Many Requests"}
```

####res.status.internalServerError([detail])
```javascript
{"type":500,"message":"Internal Server Error"}
```

####res.status.notImplemented([detail])
```javascript
{"type":501,"message":"Not Implemented"}
```

####res.status.badGateway([detail])
```javascript
{"type":502,"message":"Bad Gateway"}
```

####res.status.serviceUnavailable([detail])
```javascript
{"type":503,"message":"Service Unavailable"}
```

####res.status.gatewayTimeout([detail])
```javascript
{"type":504,"message":"Gateway Timeout"}
```

