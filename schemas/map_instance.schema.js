module.exports = {
	dbTable: 'map_instance',
	dbColumns: ['id', 'title', 'map_id', 'city_id', 'created_by', 'created_on', 'locked'],
	createSchema: {
		description: "Schema for creating map instance",
		type: "object",
		properties: {
			title: {
				description: "Map instance name",
				type: "string",
				required: true
			},
			map_id: {
				description: "Unique identifier for a map",
				type: "integer",
				required: true
			},
			city_id: {
				description: "ID of the Wikia this map instance belongs to",
				type: "integer",
				required: true
			},
			created_by: {
				description: "creator user name",
				type: "string",
				required: true
			}
		},
		maxProperties: 4,
		additionalProperties: false
	},
	updateSchema: {
		description: "Schema for updating map instance",
		type: "object",
		properties: {
			title: {
				description: "Map instance name",
				type: "string",
				minLength: 2
			},
			map_id: {
				description: "Unique identifier for a map",
				type: "integer"
			}
		},
		maxProperties: 2,
		additionalProperties: false
	}
}
