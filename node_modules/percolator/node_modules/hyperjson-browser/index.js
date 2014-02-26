var url = require('url');
var filed = require('filed');
var fs = require('fs');

var index = null;

function getIndex(mount_path, api_path, cb){
  console.log("getIndex");
  if (index){
    return cb(null, index);
  }
  var indexPath = __dirname + '/./static/index.html';
  console.log("indexPath: ", indexPath);
  fs.readFile(indexPath, 'utf-8', function (err, data) {
    if (err) {
      return cb(err);
    }
    data = data.replace(/\$\$MOUNT_PATH\$\$/g, mount_path);
    data = data.replace(/\$\$API_PATH\$\$/g, api_path);
    return cb(null, data);
  });
}

module.exports = function(mount_path, api_path){
  mount_path = mount_path.replace(/^\//, '');
  api_path = api_path.replace(/^\//, '');
  return function(req, res, next){
    var pathname = url.parse(req.url).pathname;
    var current_path = pathname.replace(/^\//, ''); // remove leading slash
    current_path = current_path.replace(/\/$/, ''); // remove trailing slash
    console.log('current_path: ', current_path, "mount_path: ", mount_path);
    if (!startsWith(current_path, mount_path)){
      return next();
    }
    var subpath = current_path.substring(mount_path.length);
    console.log("HIT sub path: ", subpath);
    if (!subpath || subpath === ''){
      // this is an index request
      if (!endsWith(pathname, '/')){
        // Redirect into the subdir if the url doesn't end with a slash
        // This is necessary for relative paths to work.
        res.setHeader('Location', pathname + '/');
        res.writeHead(301);
        return res.end();
      }
      getIndex(mount_path, api_path, function(err, data){
        if (err){
          return res.end(JSON.stringify(err));
        }
        res.write(data);
        return res.end();
      });
    } else {
      subpath = __dirname + '/./static/' + subpath;
      filed(subpath).pipe(res);
    }
  };
};

var startsWith = function(haystack, needle){
  return haystack.substring(0, needle.length) === needle;
};

var endsWith = function (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};
