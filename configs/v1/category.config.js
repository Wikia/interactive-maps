module.exports = {
	// name of table in DB
	dbTable: 'poi_category',

	// table columns used for SELECT query
	dbColumns: ['id', 'name', 'marker', 'parent_poi_category_id', 'city_id', 'created_on', 'created_by'],

	// curd collection custom response objects
	customResObjects: {
		create: {
			message: 'Category successfully created!'
		},
		update: {
			message: 'Category successfully updated!'
		}
	},

	// Schema used for validation JSON for POST requests
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

	// Schema used for validation JSON for PUT requests
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
	},

	// Schema used to add API URLs to JSON object sent to the client
	responseSchema: {
		id: {
			entryPoint: '/category/',
			paramName: 'category_url'
		},
		parent_poi_category_id: {
			entryPoint: '/category/',
			paramName: 'parent_category_url'
		}
	}
}
