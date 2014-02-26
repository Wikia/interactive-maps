var http = require('http');
var https = require('https');
var Router = require('detour').Router;
var _ = require('underscore');

var Server = function(options){
  //ip, port, protocol, resourcePath){
  options = options || {};
  this.ip = options.ip || '0.0.0.0';
  this.port = options.port || 5000;
  this.protocol = options.protocol || 'http';
  this.resourcePath = options.resourcePath || '/';
  this.key = options.key;
  this.cert = options.cert;
  this.pfx = options.pfx;
  this.router = new Router();
  this.coreServer = null;
  this.defaultResponseHeaders = {
    server : 'oneone server'
  };
  var that = this;
  this.handlers = {
    404 : function($){ $.res.statusCode = 404; $.res.end(); },
    405 : function($){ $.res.statusCode = 405; $.res.end(); },
    414 : function($){ $.res.statusCode = 414; $.res.end(); },
    500 : function($, err){ $.res.statusCode = 500;
                            console.log(err);
                            console.log(err.stack);
                            $.res.end(); },
    501 : function($){ $.res.statusCode = 501; $.res.end(); },
    OPTIONS : function(resource){
                var methods = getMethods(resource);
                resource.OPTIONS = function($){
                  $.res.setHeader( 'Allow', methods.join(","));
                  $.res.writeHead(200);
                  $.res.end();
                };
                return resource;
              }
  };
  this.router.setResourceDecorator(function(resource){
    // set the OPTIONS method at route-time, so the router won't 405 it.
    resource = that.handlers.OPTIONS(resource);
    return resource;
  });
  this.router.on404(function($){
    that.handlers['404']($);
  });
  this.router.on414(function($){
    that.handlers['414']($);
  });
  this.router.on500(function($, err){
    that.handlers['500']($, err);
  });
  this.router.on501(function($){
    that.handlers['501']($);
  });
  this.router.on405(function($){
    that.handlers['405']($);
  });
  // set the default request handler.  
  // onRequest() (below) can be used to overwrite this though
  this.onRequestHandler = function(resource, context, cb){
    cb(null, context);  // do nothing with it by default
  };
  // hook the request handler into the router
  this.router.onRequest = function(resource, context, cb){
    context.router = that.router;
    that.onRequestHandler(resource, context, cb);
  };
};

Server.prototype.setDefaultResponseHeader = function(header, value){
  this.defaultResponseHeaders[header] = value;
};

Server.prototype.on404 = function(handler){
  // the handler should be a function that takes a context
  this.handlers['404'] = handler;
};
Server.prototype.on405 = function(handler){
  // the handler should be a function that takes a context
  this.handlers['405'] = handler;
};
Server.prototype.on500 = function(handler){
  // the handler should be a function that takes a context
  this.handlers['500'] = handler;
};
Server.prototype.on501 = function(handler){
  // the handler should be a function that takes a context
  this.handlers['501'] = handler;
};
Server.prototype.on414 = function(handler){
  // the handler should be a function that takes a context
  this.handlers['414'] = handler;
};
Server.prototype.onOPTIONS = function(handler){
  // the handler should be a function that takes a *resource*
  // this should be called BEFORE routing.
  this.handlers.OPTIONS = handler;
};

Server.prototype.route = function(path, handler){
  return this.router.route(path, handler);
};

Server.prototype.staticRoute = function(dir, cb){
  this.router.staticRoute(dir, cb);
};

// run the directory router and call the callback afterward
Server.prototype.routeDirectory = function(directory, path, cb){
  this.router.routeDirectory(directory, path, cb);
};


Server.prototype.onRequest = function(handler){
  this.onRequestHandler = handler;
};


Server.prototype.listen = function(cb){
  var coreServer;
  var that = this;
  var router = this.router;
  var requestHandler = function(req, res){
    _.each(that.defaultResponseHeaders, function(v, k){
      res.setHeader(k, v);
    });
    router.dispatch({req : req, res : res});
  };
  if (this.protocol === 'https'){
    var options = {};
    if (this.pfx){ options.pfx = this.pfx; }
    if (this.key){ options.key = this.key; }
    if (this.cert){ options.cert = this.cert; }
    coreServer = https.createServer(options, requestHandler);
  } else {
    coreServer = http.createServer(requestHandler);
  }
  coreServer.listen(that.port, that.ip, cb);
  that.coreServer = coreServer;
};

Server.prototype.close = function(cb){
  this.coreServer.close(cb);
};

module.exports = Server;


var getMethods = function(resource){
  var serverSupportedMethods = ["GET", "POST",
                                "PUT", "DELETE",
                                "HEAD", "OPTIONS"];
  var moduleMethods = _.functions(resource);
  var methods = _.intersection(moduleMethods, serverSupportedMethods);
  var additionalMethods = ['OPTIONS'];
  if (_.isFunction(resource.GET)){
    additionalMethods.push('HEAD');
  }
  methods = _.union(additionalMethods, methods);
  return methods;
};
