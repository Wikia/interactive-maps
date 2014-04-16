module.exports = {
	// name of table in DB
	dbTable: 'map',

	// table columns used for SELECT query
	dbColumns: ['id', 'title', 'tile_set_id', 'city_id', 'created_by', 'created_on', 'locked'],

	// curd collection custom response objects
	customResObjects: {
		create: {
			message: 'Map successfully created!'
		},
		update: {
			message: 'Map successfully updated!'
		}
	},

	// overwrite default CURD methods
	customMethods: {
		list: require('./../../lib/listMaps')
	},

	// Schema used for validation JSON for POST requests
	createSchema: {
		description: 'Schema for creating maps',
		type: 'object',
		properties: {
			title: {
				description: 'Map title',
				type: 'string',
				required: true
			},
			tile_set_id: {
				description: 'Unique identifier for a tile set',
				type: 'integer',
				required: true
			},
			city_id: {
				description: 'ID of the Wikia this map instance belongs to',
				type: 'integer',
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

	// Schema used for validation JSON for PUT requests
	updateSchema: {
		description: 'Schema for updating map instance',
		type: 'object',
		properties: {
			title: {
				description: 'Map instance name',
				type: 'string',
				minLength: 2
			}
		},
		additionalProperties: false
	},

	// Schema used to add API URLs to JSON object sent to the client
	responseSchema: {
		id: {
			apiMethod: 'map',
			paramName: 'map_url'
		},
		tile_set_id: {
			apiMethod: 'tile_set',
			paramName: 'tile_set_url'
		}
	}
}
