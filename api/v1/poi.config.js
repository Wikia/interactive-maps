'use strict';

var jsonValidator = require('./../../lib/jsonValidator'),
	urlPattern = jsonValidator.getOptionalUrlPattern(),
	cachingUtils = require('./../../lib/cachingUtils');

module.exports = {
	dbTable: 'poi',
	poiOperations: {
		'insert': 'insert',
		'update': 'update',
		'delete': 'delete'
	},
	createSchema: {
		description: 'Schema for creating POI',
		type: 'Object',
		properties: {
			name: {
				description: 'POI name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			poi_category_id: {
				description: 'Unique identifier for category',
				type: 'integer',
				required: true
			},
			map_id: {
				description: 'Unique identifier for map',
				type: 'integer',
				required: true
			},
			description: {
				description: 'POI description',
				type: 'string',
				minLength: 1,
				maxLength: 500
			},
			link: {
				description: 'Link to article connected with this POI',
				type: 'string',
				pattern: urlPattern
			},
			link_title: {
				description: 'Title of the article connected with this POI',
				type: 'string'
			},
			photo: {
				description: 'Link photo connected with this POI',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			},
			lat: {
				description: 'POI latitude',
				type: 'number',
				required: true
			},
			lon: {
				description: 'POI longitude',
				type: 'number',
				required: true
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
		description: 'Schema for updating POI',
		type: 'Object',
		properties: {
			name: {
				description: 'POI name',
				type: 'string',
				minLength: 1,
				maxLength: 255
			},
			poi_category_id: {
				description: 'Unique identifier for category',
				type: 'integer'
			},
			description: {
				description: 'POI description',
				type: 'string',
				minLength: 1
			},
			link: {
				description: 'Link to article connected with this POI',
				type: 'string',
				pattern: urlPattern,
				format: 'uri'
			},
			link_title: {
				description: 'Title of the article connected with this POI',
				type: 'string'
			},
			photo: {
				description: 'Link photo connected with this POI',
				type: 'string',
				pattern: urlPattern,
				format: 'uri',
				maxLength: 255
			},
			lat: {
				description: 'POI latitude',
				type: 'number'
			},
			lon: {
				description: 'POI longitude',
				type: 'number'
			},
			updated_by: {
				description: 'Editor user name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			}
		},
		additionalProperties: false
	},
	poiCollectionColumns: [
		'id',
		'name'
	],
	poiColumns: [
		'name',
		'poi_category_id',
		'description',
		'link',
		'link_title',
		'photo',
		'lat',
		'lon',
		'created_on',
		'created_by',
		'updated_on',
		'updated_by',
		'map_id'
	],
	responseMessages: {
		created: 'POI successfully created',
		updated: 'POI successfully updated',
		deleted: 'POI successfully deleted'
	},
	//Unique debug strings naming actions that trigger the purge
	purgeCallers: {
		created: 'mapPoiCreated',
		updated: 'mapPoiUpdated',
		deleted: 'mapPoiDeleted'
	},
	//Cache validity for the public GET methods on / and /:id
	cacheValidity: {
		forCollection: cachingUtils.cacheStandard,
		forWildcard: cachingUtils.cacheStandard
	}
};
