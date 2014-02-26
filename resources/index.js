exports.handler = {
	GET : function(req, res){
		res.object({versions : {v1: req.uri.url + '/v1'}}).send();
	}
};
