exports.handler = {
	GET : function(req, res){
		res.object({message : 'get all maps'}).send();
	}
};
