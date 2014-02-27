/*!
 * connect-jade
 * Copyright(c) 2012 yitsushi <yitsushi@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var fs = require('fs');
var path = require('path');
var http = require('http');
var jade = require('jade');

var settings = {
  root: __dirname + '/views',
  layout: 'layout.html',
  debug: true,
  defaults: {}
};

var cache = {};

/**
 * Render the view fill with locals
 *
 * @param  {String} path    view name.
 * @param  {Object} [locals=null]
 */
function render(path, locals) {
  var res = this;
  if (typeof locals == "undefined") {
    locals = settings.defaults;
  } else {
    for (var k in settings.defaults) {
      if (!locals.hasOwnProperty(k)) {
        locals[k] = settings.defaults[k];
      }
    }
  }
  path = settings.root + "/" + path + ".jade";

  try {
    fs.realpathSync(path);
  } catch (e) {
    // if file doesn't not exist then send 404 error
    // TODO: settings.errorpages.404
    res.writeHead(404);
    return res.end("404 - not found");
  }

  // if debug is enabled check cache for view content
  if (!settings.debug && cache.hasOwnProperty(path)) {
    var jadeContent = jade.compile(cache[path], {filename: path});
    var html = jadeContent(locals);
    res.write(html);
    return res.end();
  }

  // read view content
  fs.readFile(path, function readViewFile(err, data) {
    if (err) {
      if (settings.debug) {
        console.log(err);
      }
      // if there was any error then send an 500 error
      // TODO: settings.errorpages.500
      res.writeHead(500);
      return res.end("500 - internal server error");
    }

    res.writeHead(200, { "Content-Type": "text/html" });

    // cache view content
    cache[path] = data;

    // call jade compiler and render output html
    var jadeContent = jade.compile(data, {filename: path});
    var html = jadeContent(locals);

    // send rendered html to the client
    res.write(html);
    return res.end();
  });

  return this;
}

/**
 * Add a variable to views like as defaults
 * These variables available with
 * $ (dollar sign) prefix
 *
 * example:
 *   var user = { name: "username" };
 *   res.addVariable('user', user);
 *
 *   // view
 *   $user.name
 *
 * @param  {String} name     variable name
 * @param  {Object} value    value of the variable
 * @return {Object} [@value]
 */
function addVariable(name, value) {
  settings.defaults['$' + name] = value;

  return value;
}

/**
 * Remove a variable from defaults (with $ sign only)
 *
 * @param  {String} name     variable name
 * @return {boolean}
 */
function removeVariable(name) {
  delete settings.defaults['$' + name];

  return true;
}

/**
 * Add a function to views like as defaults
 * These functions available with
 * _ (underscore) prefix
 *
 * example:
 *   res.addFunction('antispam', function antispam(email) {
 *     return email.replace(/@/, " [at] ");
 *   });
 *
 *   // view
 *   _antispam($user.email)
 *
 * @param  {String}   name     name of the function
 * @param  {Function} value    The function
 * @return {Boolean}
 */
function addFunction(name, value) {
  if (typeof value != "function") {
    throw "value must be a function";
    return false;
  }
  settings.defaults['_' + name] = value;

  return true;
}

/**
 * Remove a function from defaults (with _ sign only)
 *
 * @param  {String}   name     name of the function
 * @return {Boolean}
 */
function removeFunction(name) {
  delete settings.defaults['_' + name];

  return true;
}

/**
 * Check for a function (with _ sign only)
 * If function exists the returns true
 * else returns false
 *
 * @param  {String}   name     name of the function
 * @return {Boolean}
 */
function hasFunction(name) {
  return (typeof settings.defaults['_' + name] == "function");
}

/**
 * connect-jade: Template Render helper for connect
 *
 * Use case:
 *
 * var connectJade = require('./lib/connect-jade');
 * var connect = require('connect');
 *
 * connect(
 *   connectJade({
 *     root: __dirname + "/views",
 *     debug: true
 *   })
 * );
 *
 * res.render('index', { title: 'Index Page', items: items });
 *
 * @param {Object} [options={}] render options.
 * @return {Function} render middleware for `connect`
 */
module.exports = function (options) {
  options = options || {};
  for (var k in options) {
    settings[k] = options[k];
  }
  return function (req, res, next) {
    req.next = next;
    if (!res.req) {
      res.req = req;
    }

    // TODO: Need to rethink the whole funcionality
    res.render          = render;
    res.addVariable     = addVariable;
    res.removeVariable  = removeVariable;
    res.addFunction     = addFunction;
    res.removeFunction  = removeFunction;
    res.hasFunction     = hasFunction;
    return next();
  };
};