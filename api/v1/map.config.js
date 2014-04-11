module.exports = {
	// name of table in DB
	dbTable: 'map',

	// table columns used for SELECT query
	dbColumns: ['id', 'name', 'type', 'width', 'height', 'min_zoom', 'max_zoom', 'created_by', 'created_on'],

	// block CURD methods
	blockedMethods: {
		wildcard: {
			DELETE: false,
			PUT: false
		}
	},

	// overwrite default CURD methods
	customMethods: {
		insert: require('./../../lib/addMap')
	},

	// curd collection custom response objects
	customResObjects: {
		create: {
			message: 'Map added to processing queue',
			id: 1
		}
	},

	// Schema used for validation JSON for POST requests
	createSchema: {
		description: 'Schema for creating map',
		type: 'Object',
		properties: {
			name: {
				description: 'Map name',
				type: 'string',
				required: true
			},
			url: {
				description: 'Url image from which tiles wil be created',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				required: true
			},
			created_by: {
				description: 'creator user name',
				type: 'string',
				required: true
			}
		},
		additionalProperties: false
	},

	// Schema used to add API URLs to JSON object sent to the client
	responseSchema: {
		id: {
			apiMethod: 'map',
			paramName: 'map_url'
		}
	}
};
