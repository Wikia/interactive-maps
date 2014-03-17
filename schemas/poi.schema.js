module.exports = {
	// name of table in DB
	dbTable: 'poi',

	// table columns used for SELECT query
	dbColumns: ['id', 'name', 'poi_category_id', 'description', 'link', 'photo', 'lat', 'lon', 'created_on',
		'created_by', 'updated_on', 'updated_by', 'map_instance_id'],

	// Schema used for validation JSON for POST requests
	createSchema: {
		description: "Schema for creating POI",
		type: "Object",
		properties: {
			name: {
				description: "POI name",
				type: "string",
				required: true
			},
			poi_category_id: {
				description: "Unique identifier for category",
				type: "integer",
				required: true
			},
			map_instance_id: {
				description: "Unique identifier for map instance",
				type: "integer",
				required: true
			},
			description: {
				description: "POI description",
				type: "string"
			},
			link: {
				description: "Link to article connected with this POI",
				type: "string",
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			},
			photo: {
				description: "Link photo connected with this POI",
				type: "string",
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			},
			lat: {
				description: "POI latitude",
				type: "number",
				required: true
			},
			lon: {
				description: "POI longitude",
				type: "number",
				required: true
			},
			created_by: {
				description: "creator user name",
				type: "string",
				required: true
			},
			updated_by: {
				description: "creator user name",
				type: "string",
				required: true
			}
		},
		maxProperties: 10,
		additionalProperties: false
	},

	// Schema used for validation JSON for PUT requests
	updateSchema: {
		description: "Schema for updating POI",
		type: "Object",
		properties: {
			name: {
				description: "POI name",
				type: "string"
			},
			poi_category_id: {
				description: "Unique identifier for category",
				type: "integer"
			},
			description: {
				description: "POI description",
				type: "string"
			},
			link: {
				description: "Link to article connected with this POI",
				type: "string",
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				format: 'uri'
			},
			photo: {
				description: "Link photo connected with this POI",
				type: "string",
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				format: 'uri'
			},
			lat: {
				description: "POI latitude",
				type: "number"
			},
			lon: {
				description: "POI longitude",
				type: "number"
			},
			updated_by: {
				description: "Editor user name",
				type: "string",
				required: true
			}
		},
		maxProperties: 8,
		additionalProperties: false
	}
}
