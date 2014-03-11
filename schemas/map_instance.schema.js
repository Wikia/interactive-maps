module.exports = {
	createSchema : {
		description: "Map instance created from custom tile map or open street maps",
		type: "object",
		properties: {
			title: {
				description: "Map instance name",
				type: "string",
				minLength: 2,
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
				minLength: 2,
				required: true
			}
		}
	},
	updateSchema: {
		description: "Map instance created from custom tile map or open street maps",
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
		}
	}
}