var curd = require('./../../lib/curd'),
	schema = require('./../../schemas/poi.schema.js'),
	collection = curd.createCollection(schema);

exports.handler = collection.handler;
exports.wildcard = collection.wildcard;
