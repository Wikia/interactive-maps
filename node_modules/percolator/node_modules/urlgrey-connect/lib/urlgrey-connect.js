var urlgrey = require('urlgrey');

module.exports = function(protocol, name){
	if (!name){
		name = 'uri';
	}
	return function(req, res, next){
    var url = protocol + '://' + req.headers.host + req.url;
		req[name] = urlgrey(url);
		next();
	};
};
