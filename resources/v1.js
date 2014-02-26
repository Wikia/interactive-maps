exports.handler = {
	GET : function(req, res){
		var url = req.uri.url;

		res.object({message : 'version 1 of interactive maps API'}).send();
	}
};
