#onBodyMiddleware
[![Build
Status](https://secure.travis-ci.org/cainus/onBodyMiddleware.png?branch=master)](http://travis-ci.org/cainus/onBodyMiddleware)
[![Coverage Status](https://coveralls.io/repos/cainus/onBodyMiddleware/badge.png?branch=master)](https://coveralls.io/r/cainus/onBodyMiddleware)
[![NPM version](https://badge.fury.io/js/onBodyMiddleware.png)](http://badge.fury.io/js/)

This is a simple connect middleware for getting an http request's body as a buffer or string because I got tired of doing it manually.

 This middleware adds an onBody function to the req and calls back when done.

 The onBody function takes a callback in the form 

```javascript
function(err, body){ ...
```
...where `err` is an error that may have occurred and `body` is the entire body of the request.

onBodyMiddleware is useful for any scenario where the streaming interface is unnecessary (basically anytime you need the entire body before you can do any processing).

###Setup:
```javascript
var onBodyMiddleware = require('onBodyMiddleware');
connectApp.use(onBodyMiddleware);
```

###Use:
```javascript
  function(req, res){
    req.onBody(function(err, body){
      if (err){
        res.end(JSON.stringify(err));
      } else {
        console.log(body);
        res.end("nice body!");
      }
    });
  }

```
