var CURDCollection = require('percolator').CRUDCollection,
	mocks = {
		list: [
			{
				id: '/map_instance/12345/',
				name: 'Lorem ipsum',
				thumbnail: 'path_to_thumbnail',
				cityId: 123456

			},
			{
				id: '/map_instance/12345/',
				name: 'Lorem ipsum',
				thumbnail: 'path_to_thumbnail',
				cityId: 123456
			},
			{
				id: '/map_instance/12345/',
				name: 'Lorem ipsum',
				thumbnail: 'path_to_thumbnail',
				cityId: 123456
			},
			{
				id: '/map_instance/12345/',
				name: 'Lorem ipsum',
				thumbnail: 'path_to_thumbnail',
				cityId: 123456
			}
		],
		item: {
			id: null,
			name: 'Lorem ipsum',
			description: 'Lorem ipsum dolor',
			map: '/map/12345/',
			cityId: 123456,
			thumbnail: 'path_to_thumbnail',
			pois: '/poi?mapId=',
			metadata: {
				created: 'some time format',
				edited: 'some time format',
				creator: 'User name',
				editor: 'User name'
			}
		}
	},
	schema = {
		description: "Map instance created from custom tile map or open street maps",
		type: "object",
		properties: {
			name: {
				description: "Map instance name",
				type: "string",
				minLength: 2,
				required: true
			},
			description: {
				description: "Map instance description",
				type: "string"
			},
			map: {
				description: "API path to custom tile map",
				type: "string",
				pattern: '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/',
				format: 'uri',
				required: true
			},
			cityId: {
				description: "ID of the Wikia this map instance belongs to",
				type: "integer",
				required: true
			},
			metadata: {
				description: "Metadata for this map instance",
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
			mocks.item.pois += req.uri.child();
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