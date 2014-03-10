var CURDCollection = require('percolator').CRUDCollection,
	mocks = {
		list: [
			{
				id: '/category/12345/'

			},
			{
				id: '/category/12345/'
			},
			{
				id: '/category/12345/'
			},
			{
				id: '/category/12345/'
			}
		],
		item: {
			id: 12345,
			name: 'Lorem ipsum',
			parent: '/category/12345',
			cityId: 12345,
			marker: 'path/to/marker',
			metadata: {
				created: 'some time format',
				edited: 'some time format',
				creator: 'User name',
				editor: 'User name'
			}
		}
	},
	schema = {
		description: "Point of interest category",
		type: "Object",
		properties: {
			name: {
				description: "Category name",
				type: "string",
				minLength: 2,
				required: true
			},
			parent: {
				description: "API path to parent category",
				type: "string",
				pattern: '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
				format: 'uri',
				required: true
			},
			marker: {
				description: "Path to marker icon",
				type: "string",
				pattern: '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
				format: 'uri',
				required: true
			},
			cityId: {
				description: "Unique identifier of Wikia that this category belongs to",
				type: "integer",
				required: true
			},
			metadata: {
				description: "Metadata for this category",
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