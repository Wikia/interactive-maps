'use strict';
var cachingUtils = require('./../../lib/cachingUtils');

module.exports = {
	mapColumns: [
		'id',
		'title',
		'city_id',
		'deleted'
	],
	poiColumns: [
		'id',
		'name',
		'link',
		'link_title',
		'description',
		'poi_category_id'
	],
	poiCategoryColumns: [
		'id',
		'name'
	],
	//Cache validity for the public GET methods on / and /:id
	cacheValidity: {
		wildcard: cachingUtils.cacheStandard
	},
	path: 'map_data/'
};
