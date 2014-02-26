exports.handler = {
	GET : function(req, res){
		res.object({message : 'list of all pois'}).send();
	}
};
