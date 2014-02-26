exports.handler = {
	GET : function(req, res){
		res.object({message : 'get info about poi'}).send();
	}
};
