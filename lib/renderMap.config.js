'use strict';

module.exports = {
	mapColumns: [
		'map.id',
		'map.title',
		'map.city_title',
		'map.city_url',
		'map.city_id',
		'map.locked',
		'map.updated_on',
		'map.tile_set_id',
		'tile_set.name',
		'tile_set.type',
		'tile_set.url',
		'tile_set.width',
		'tile_set.height',
		'tile_set.min_zoom',
		'tile_set.max_zoom',
		'tile_set.background_color',
		'tile_set.status',
		'tile_set.attribution',
		'tile_set.subdomains'
	],
	poiColumns: [
		'id',
		'name',
		'poi_category_id',
		'description',
		'link',
		'link_title',
		'photo',
		'lat',
		'lon'
	],
	poiCategoryColumns: [
		'id',
		'parent_poi_category_id',
		'map_id',
		'name',
		'marker',
		'status'
	],
	leafletImagesPath: '/vendor/leaflet/images'
};
