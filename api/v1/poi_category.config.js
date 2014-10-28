'use strict';

var jsonValidator = require('./../../lib/jsonValidator'),
	urlPattern = jsonValidator.getUrlPattern(),
	cachingUtils = require('./../../lib/cachingUtils');

module.exports = {
	dbTable: 'poi_category',
	getCollectionDbColumns: [
		'id',
		'name',
		'marker',
		'map_id',
		'status'
	],
	getCategoryDBColumns: [
		'name',
		'marker',
		'parent_poi_category_id',
		'status',
		'map_id',
		'created_on',
		'created_by'
	],
	responseMessages: {
		created: 'POI category successfully created',
		updated: 'POI category successfully updated',
		deleted: 'POI category successfully deleted'
	},
	createSchema: {
		description: 'Schema for creating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			map_id: {
				description: 'ID of the map this POI belongs to',
				type: 'integer',
				required: true
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			},
			parent_poi_category_id: {
				description: 'Unique identifier for parent category',
				type: 'integer'
			},
			created_by: {
				description: 'creator user name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			}
		},
		additionalProperties: false
	},
	updateSchema: {
		description: 'Schema for updating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string',
				minLength: 1,
				maxLength: 255
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			},
			parent_poi_category_id: {
				description: 'Unique identifier for parent category',
				type: 'integer'
			}
		},
		additionalProperties: false
	},
	//Cache validity for the public GET methods on / and /:id
	cacheValidity: {
		handler: cachingUtils.cacheStandard,
		wildcard: cachingUtils.cacheStandard
	}
};
