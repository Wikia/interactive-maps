'use strict';

var jsonValidator = require('./../../lib/jsonValidator'),
	cachingUtils = require('./../../lib/cachingUtils'),
	urlPattern = jsonValidator.getUrlPattern();

module.exports = {
	dbTable: 'map',
	createSchema: {
		description: 'Schema for creating maps',
		type: 'object',
		properties: {
			title: {
				description: 'Map title',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
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
			city_title: {
				description: 'Name of the Wikia this map instance belongs to',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			city_url: {
				description: 'URL of the Wikia this map instance belongs to',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255,
				pattern: urlPattern
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
		description: 'Schema for updating map instance',
		type: 'object',
		properties: {
			title: {
				description: 'Map instance name',
				type: 'string',
				minLength: 1
			},
			deleted: {
				description: 'Map deleted flag',
				type: 'bool'
			},
			city_title: {
				description: 'Name of the Wikia this map instance belongs to',
				type: 'string',
				minLength: 1,
				maxLength: 255
			},
			city_url: {
				description: 'URL of the Wikia this map instance belongs to',
				type: 'string',
				minLength: 1,
				maxLength: 255,
				pattern: urlPattern
			}
		},
		additionalProperties: false
	},
	sortingOptions: {
		title_asc: {
			column: 'map.title',
			direction: 'asc'
		},
		updated_on_desc: {
			column: 'map.updated_on',
			direction: 'desc'
		},
		created_on: {
			column: 'map.created_on',
			direction: 'desc'
		}
	},
	mapsCollectionColumns: [
		'map.id',
		'map.title',
		'tile_set.image',
		'map.updated_on',
		'tile_set.status',
		'tile_set.id as tile_set_id'
	],
	mapColumns: [
		'id',
		'title',
		'tile_set_id',
		'city_id',
		'created_by',
		'created_on',
		'updated_on',
		'deleted'
	],
	responseMessages: {
		created: 'Map successfully created',
		updated: 'Map successfully updated',
		deleted: 'Map successfully deleted'
	},
	purgeCallers: {
		created: 'mapCreated',
		updated: 'mapUpdated',
		deleted: 'mapDeleted'
	},
	//Cache validity for the public GET methods on / and /:id
	cacheValidity: {
		handler: cachingUtils.cacheStandard,
		wildcard: cachingUtils.cacheStandard
	},
	surrogateKeys: {
		handler: 'mapHandler'
	},
	path: 'map/'
};
