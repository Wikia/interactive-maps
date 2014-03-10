var CURDCollection = require('percolator').CRUDCollection,
	mocks = {
		list: [
			{
				id: 12345,
				name: 'Lorem ipsum'
			},
			{
				id: 12345,
				name: 'Lorem ipsum'
			},
			{
				id: 12345,
				name: 'Lorem ipsum'
			},
			{
				id: 12345,
				name: 'Lorem ipsum'
			}
		],
		item: {
			id: null,
			name: 'Lorem ipsum',
			mapURL: 'path_to_tiles',
			maxZoom: 5,
			minZoom: 0,
			metadata: {
				'created': 'some time format',
				'creator': 'User name'
			}
		}
	},
	schema = {
		description: 'Map created from custom tiles',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a custom tile map',
				type: 'string',
				required: true,
				minLength: 2

			},
			mapURL: {
				description: 'URL to the map tiles',
				type: 'string',
				pattern: '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
				format: 'uri',
				required: true
			},
			maxZoom: {
				description: 'Maximum zoom level',
				type: 'integer',
				maximum: 8,
				minimum: 0,
				required: true
			},
			minZoom: {
				description: 'Minimum zoom level',
				type: 'integer',
				maximum: 8,
				minimum: 0,
				required: true
			},
			metadata: {
				description: 'Metadata for this custom tile map',
				type: 'object',
				properties: {
					created: {
						description: 'creation date',
						type: 'string',
						format: 'data-time',
						required: true
					},
					creator: {
						description: 'creator user name',
						type: 'string',
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
		}
	});

exports.handler = collection.handler;
exports.wildcard = collection.wildcard;