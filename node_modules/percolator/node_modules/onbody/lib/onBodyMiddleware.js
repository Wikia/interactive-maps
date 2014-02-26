
var onBodyMiddleware = function(req, res, next){
  req.onBody = function(onBodyCB){
    var body = '';
    req.on('data', function(data){
      body += data;
    });
    req.on('error', function(err){
      return onBodyCB(err, body);
    });
    req.on('end', function(){
      return onBodyCB(null, body);
    });
  };
  next();
};


module.exports = onBodyMiddleware;




