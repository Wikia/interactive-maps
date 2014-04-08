module.exports = {
	// name of table in DB
	dbTable: 'map_instance',

	// table columns used for SELECT query
	dbColumns: ['id', 'title', 'map_id', 'city_id', 'created_by', 'created_on', 'locked'],

	// curd collection custom response objects
	customResObjects: {
		create: {
			message: 'Map instance successfully created!'
		},
		update: {
			message: 'Map instance successfully updated!'
		}
	},

	// Schema used for validation JSON for POST requests
	createSchema: {
		description: 'Schema for creating map instance',
		type: 'object',
		properties: {
			title: {
				description: 'Map instance name',
				type: 'string',
				required: true
			},
			map_id: {
				description: 'Unique identifier for a map',
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
			},
			map_id: {
				description: 'Unique identifier for a map',
				type: 'integer'
			}
		},
		additionalProperties: false
	},

	// Schema used to add API URLs to JSON object sent to the client
	responseSchema: {
		id: {
			apiMethod: 'map_instance',
			paramName: 'map_instance_url'
		},
		map_id: {
			apiMethod: 'map',
			paramName: 'map_url'
		}
	}
}
