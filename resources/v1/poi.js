var CURDCollection = require('percolator').CRUDCollection,
	mocks = {
		list: [
			{
				id: '/map_instance/12345/'

			},
			{
				id: '/map_instance/12345/'
			},
			{
				id: '/map_instance/12345/'
			},
			{
				id: '/map_instance/12345/'
			}
		],
		item: {
			id: 12345,
			name: "Lorem ipsum",
			article: "path_to_article",
			category: "/category/12345",
			coordinates: [123, 123],
			metadata: {
				created: 'some time format',
				edited: 'some time format',
				creator: 'User name',
				editor: 'User name'
			}
		}
	},
	schema = {
		description: "Point of interest",
		type: "Object",
		properties: {
			name: {
				description: "POI name",
				type: "string",
				minLength: 2,
				required: true
			},
			article: {
				description: "path to article connected with this POI",
				type: "string",
				pattern: '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
				format: 'uri',
				required: true
			},
			category: {
				description: "path to category",
				type: "string",
				pattern: '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
				format: 'uri',
				required: true
			},
			coordinates: {
				description: "Object containing POI coordinates",
				type: "object",
				properties: {
					latitude: {
						description: "POI latitude",
						type: "number",
						required: true
					},
					longitude: {
						description: "POI longitude",
						type: "number",
						required: true
					}
				},
				required: true
			},
			metadata: {
				description: "Metadata for this POI",
				type: "object",
				properties: {
					created: {
						description: "creation date",
						type: "string",
						format: 'data-time',
						required: true
					},
					edited: {
						description: "last edition date",
						type: "string",
						format: 'data-time',
						required: true
					},
					creator: {
						description: "creator user name",
						type: "string",
						minLength: 1,
						required: true
					},
					editor: {
						description: "last editor user name",
						type: "string",
						minLength: 1,
						required: true
					}
				},
				required: true
			}
		}
	},
	collection = new CURDCollection({
		schema: schema,
		create: function(req, res, obj, cb) {
			cb();
		},
		destroy: function(req, res, id, cb) {
			cb();
		},
		fetch: function(req, res, cb) {
			mocks.item.id = req.uri.child();
			cb(null, mocks.item);
		},
		list: function(req, res, cb) {
			cb(null, mocks.list);
		},
		update : function(req, res, id, obj, cb){
			cb();
		}
	});

exports.handler = collection.handler;
exports.wildcard = collection.wildcard;