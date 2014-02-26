# Reaper

[![Build
Status](https://secure.travis-ci.org/cainus/reaper.png?branch=master)](http://travis-ci.org/cainus/reaper)
[![Coverage
Status](https://coveralls.io/repos/cainus/reaper/badge.png?branch=master)](https://coveralls.io/r/cainus/reaper)
[![NPM
version](https://badge.fury.io/js/reaper.png)](http://badge.fury.io/js/reaper)


Reaper picks the correct media-type for a resource based on a
request's Accept header and what the resource or server supports.

It also allows the registration of serializers / deserializers for
automatic serialization and deserialization of any formats that might 
be automatically serializable/deserializable.


```javascript

var reaper = new Reaper();
reaper.register('application/json', 
                function(str){ return JSON.parse(str); },
                function(obj){ return JSON.stringify(obj); });

reaper.isAcceptable('application/json');   // returns true
reaper.isAcceptable('*/*');   // returns true
reaper.isAcceptable('application/xml');   // returns false

reaper.isRegistered('application/json');  // returns true
reaper.isRegistered('application/xml');  // returns false

reaper.input("application/json", '{"hello" : "world"}');  // returns {hello : "world"}
reaper.output("application/json", {hello : "world"});   // returns '{"hello" : "world"}'


```

Additionally Reaper comes with a connect-compatible middleware that attaches a `body` and `rawBody` object to your request object that automatically uses any deserializer you may have configured for the content-type to populate the `body` property.  The middleware will return errors in the case of bad deserialization, or unacceptable Accept / Content-Type headers.


