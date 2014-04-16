'use strict';

var utils = require('../../lib/utils');

module.exports = {
	// name of table in DB
	dbTable: 'tile_set',

	// table columns used for SELECT query
	dbColumns: ['id', 'name', 'type', 'org_img', 'width', 'height', 'min_zoom', 'max_zoom', 'created_by', 'created_on'],

	transforms: {
		'max_zoom': utils.binToMaxZoomLevel
	},

	// block CURD methods
	blockedMethods: {
		wildcard: {
			DELETE: false,
			PUT: false
		}
	},

	// overwrite default CURD methods
	customMethods: {
		insert: require('./../../lib/addTileSet')
	},

	// curd collection custom response objects
	customResObjects: {
		create: {
			message: 'Tileset added to processing queue'
		}
	},

	// Schema used for validation JSON for POST requests
	createSchema: {
		description: 'Schema for creating tile set',
		type: 'Object',
		properties: {
			name: {
				description: 'Tile set name',
				type: 'string',
				required: true
			},
			url: {
				description: 'URL to image from which tiles wil be created',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				required: true
			},
			created_by: {
				description: 'Creator user name',
				type: 'string',
				required: true
			}
		},
		additionalProperties: false
	},

	// Schema used to add API URLs to JSON object sent to the client
	responseSchema: {
		id: {
			apiMethod: 'tile_set',
			paramName: 'tile_set_url'
		}
	}
};
