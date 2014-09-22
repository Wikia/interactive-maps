'use strict';

var jsonValidator = require('./../../lib/jsonValidator'),
	minSearchCharacters = 2;

module.exports = {
	dbTable: 'tile_set',
	getCollectionDbColumns: [
		'tile_set.id',
		'tile_set.name',
		'tile_set.type',
		'tile_set.status',
		'tile_set.width',
		'tile_set.height',
		'tile_set.image'
	],
	getTileSetDbColumns: [
		'name',
		'type',
		'image',
		'width',
		'height',
		'min_zoom',
		'max_zoom',
		'status',
		'created_by',
		'created_on',
		'attribution',
		'subdomains'
	],
	createSchema: {
		description: 'Schema for creating tile set',
		type: 'Object',
		properties: {
			name: {
				description: 'Tile set name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			url: {
				description: 'URL to image from which tiles wil be created',
				type: 'string',
				pattern: jsonValidator.getUrlPattern(),
				required: true,
				maxLength: 255
			},
			created_by: {
				description: 'Creator user name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			}
		},
		additionalProperties: false
	},
	searchLimit: 50,
	minSearchCharacters: minSearchCharacters,
	searchErrorMsg: 'Search string should be at least ' + minSearchCharacters + ' long.'
};
