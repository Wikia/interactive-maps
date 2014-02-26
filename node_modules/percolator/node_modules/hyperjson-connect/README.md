hyperjson-connect
=================

This is a connect-compatible middleware for adding support for easily creating json api responses based on the [hyper+json spec](https://github.com/cainus/hyper-json-spec) (using the [hyperjson library](https://github.com/cainus/hyper-json/)).



[![Build Status](https://travis-ci.org/cainus/hyperjson-connect.png?branch=master)](https://travis-ci.org/cainus/hyperjson-connect)
[![Coverage Status](https://coveralls.io/repos/cainus/hyperjson-connect/badge.png?branch=master)](https://coveralls.io/r/cainus/hyperjson-connect?branch=master)

[![NPM](https://nodei.co/npm/hyperjson-connect.png)](https://nodei.co/npm/hyperjson-connect/)


This middleware provides a fluent interface for adding links to json api responses.  Links are added in the Hyper+json style (documented 
[here](https://github.com/cainus/hyper-json-spec) ).

This sort of library is useful if you want to create hypermedia apis using json.

## A few examples:

### res.object()

##### Basic Usage  
Create a json representation of an object and send it in the http response:
```javascript
res.object({thisis : "a test"}).send();
```

#### .toString()
Creates json strings from objects.
```javascript
res.object({thisis : "a test"}).toString();  // '{"thisis":"a test"}'
```

#### .send()
Actually send a response.
```javascript
res.object({thisis : "a test"}).send();
                 /* { thisis : "a test", 
                      prop1 : {
                        random : "value"}
                      }
                 */
```

#### .toObject()
Returns the resulting deserialized "json" object.
```javascript
res.object({thisis : "a test"}).toObject();  // {"thisis":"a test"}
```

#### .property()
Adds a property to the json output.
```javascript
res.object({thisis : "a test"})
  .property("prop1", {random : "value"})
  .send();                 /* { thisis : "a test", 
                                    prop1 : {
                                      random : "value"}
                                  }
                               */
```




#### .link()
Adds a link to the json output.
```javascript
res.object({thisis : "a test"})
  .link("self", "http://localhost:8080/api/test")
  .send();                 /* { thisis : "a test", 
                                    _links : {
                                      self : {
                                        href : "http://localhost:8080/api/test"
                                      }
                                  }
                               */
```
This can be called multiple times to add more links.
```javascript
res.object({thisis : "a test"})
  .link("self", "http://localhost:8080/api/test")
  .link("parent", "http://localhost:8080/api/")
  .link("kid", "http://localhost:8080/api/kid1")
  .link("kid", "http://localhost:8080/api/kid2")
  .send();                 /* { thisis : "a test", 
                                    _links : {
                                      self : {
                                        href : "http://localhost:8080/api/test"
                                      },
                                      parent : {
                                        href : "http://localhost:8080/api/"
                                      },
                                      kid : [{
                                        href : "http://localhost:8080/api/kid1"
                                      },{
                                        href : "http://localhost:8080/api/kid2"
                                      }]
                                  }
                               */
```
`link()` can also be used to add non-traditional links for HTTP methods other than GET.
```javascript
res.object({thisis : "a test"})
  .link("self", "http://percolatorjs.com", {type : 'application/json', schema : {}, method : 'POST'})
  .send();                  /* {  thisis : "a test", 
                                      _links : {
                                          self : { href : "http://percolatorjs.com",
                                                   type : 'application/json',
                                                   schema : {},
                                                   method : 'POST' }
                                      }
                                    }
                                */

```

Check out the [hyper+json spec](https://github.com/cainus/hyper-json-spec) if you want to read more about these kinds of links.

### res.collection()
`res.collection()` has all the same features of res.object(), except it takes an array of objects instead of just one object, and returns them wrapped in a json object that is also linkable.  Here's some eaxmple output:

```javascript
res.collection([{test:1}, {test:2}]).send();
    /*
      {
        "_items" : [
          {"test" : 1}, {"test" : 2}
        ]
      }
    */
```




