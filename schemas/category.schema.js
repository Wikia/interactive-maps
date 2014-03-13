module.exports = {
	dbTable: 'poi_category',
	dbColumns: ['id', 'name', 'marker', 'parent_poi_category_id', 'city_id', 'created_on', 'created_by'],
	createSchema: {
		description: "Schema for creating a category",
		type: "object",
		properties: {
			name: {
				description: "Name of a category",
				type: "string",
				required: true
			},
			marker: {
				description: "Url to custom marker icon",
				type: "string",
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			},
			parent_poi_category_id: {
				description: "Unique identifier for parent category",
				type: "integer"
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
		description: "Schema for updating a category",
		type: "object",
		properties: {
			name: {
				description: "Name of a category",
				type: "string"
			},
			marker: {
				description: "Url to custom marker icon",
				type: "string",
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			}
		},
		maxProperties: 2,
		additionalProperties: false
	}
}
