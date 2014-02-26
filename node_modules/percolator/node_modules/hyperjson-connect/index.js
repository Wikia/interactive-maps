var HyperJson = require("hyperjson");
var urlgrey = require("urlgrey");
var _ = require("underscore");
var HyperJsonCollection = require('./HyperJsonCollection');


var send = function(req, res, jsonObj, options) {
  if (!(jsonObj instanceof HyperJson)) {
    throw new Error("send is for hyperjson objects only");
  }
  if (options.defaultLinks){
    addDefaultLinks(req, res, jsonObj, options);
  }
  res.setHeader("content-type", "application/json; charset=utf-8");
  var body = JSON.stringify(jsonObj.toObject());
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
};

var addDefaultLinks = function(req, res, json, options) {
  var current, parent;
  if (json instanceof HyperJson) {
    current = json.toObject();
  } else {
    current = json;
  }
  if (!current._links || !current._links.parent) {
    try {
      var host = 'localhost';
      if (!!req.headers.host){
        host = req.headers.host;
      }
      var base = options.protocol + 
        '://' +
        (req.headers.host || 'localhost');
      parent = urlgrey(base)
                .hostname(req.headers.host || 'localhost')
                .path(req.url)
                .parent()
                .toString();
      json.link("parent", parent);
    } catch (ex) {
      if (ex.message !== "The current path has no parent path") {
        throw ex;
      }
    }
  }
  return current;
};

var factory = function(options){
  options = options || {};
  if (options.defaultLinks !== false){
    options.defaultLinks = true;
  }
  var objectName = options.objectName || "object";
  var collectionName = options.collectionName || "collection";
  options.protocol = options.protocol || "http";

  var middleware = function(req, res, next) {
    res[objectName] = function(obj) {
      var json;
      json = new HyperJson(obj);
      json.send = function() {
        return send(req, res, json, options);
      };
      return json;
    };
    res[collectionName] = function(objArr, key) {
      var json;
      json = new HyperJsonCollection(objArr, key);
      json.send = function() {
        return send(req, res, json, options);
      };
      return json;
    };
    return next();
  };

  return middleware;

};

module.exports = factory;
