'use strict';

var config = require('./config'),
	Q = require('q'),
	dbCon = require('./db_connector'),
	utils = require('./utils');

/**
 * @desc Load Map instance
 *
 * @param {object} conn Database connection
 * @param {number} mapId
 * @returns {object} - promise
 */
function getMapInfo(conn, mapId) {
	return dbCon.knex('map')
		.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
		.column([
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
		])
		.where('map.id', '=', mapId)
		.andWhere(function () {
			this.whereIn('tile_set.status', [
				utils.tileSetStatus.ok,
				utils.tileSetStatus.processing,
				utils.tileSetStatus.private
			]);
		})
		.connection(conn)
		.select();
}

/**
 * @desc Load Points for map instance
 * @param {object} conn Database connection
 * @param {number} mapId
 * @param {bool} raw - indicates if just basic data needed (id, name and category id)
 * @returns {object} - promise
 */
function loadPoints(conn, mapId, raw) {
	var columns = raw ? [
		'id',
		'name',
		'description',
		'poi_category_id'
	] : [
		'id',
		'name',
		'poi_category_id',
		'description',
		'link',
		'link_title',
		'photo',
		'lat',
		'lon'
	];
	return dbCon.select(
		conn,
		'poi', columns, {
			map_id: mapId
		}
	).then(
		function (collection) {
			collection.forEach(function (item) {
				item.name = utils.escapeHtml(item.name);

				if (item.description) {
					item.description = utils.escapeHtml(item.description);
				}
			});
			return collection;
		}
	);
}

/**
 * @desc Load point types
 *
 * @param {object} conn Database connection
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadTypes(conn, mapId, raw) {
	var columns = raw ? [
		'id',
		'name'
	]: [
		'id',
		'parent_poi_category_id',
		'map_id',
		'name',
		'marker',
		'status'
	];
	return dbCon.select(
		conn,
		'poi_category',
		columns,
		{
			'map_id': mapId
		}
	).then(
		function (collection) {
			if(!raw){
				utils.handleDefaultMarker(collection);
				utils.convertMarkersNamesToUrls(collection, config.dfsHost, config.bucketPrefix, config.markersPrefix);
			}
			collection.forEach(function (item) {
				item.name = utils.escapeHtml(item.name);
			});
			return collection;
		}
	);
}

/**
 * @desc Get points
 * @param {object} conn Database connection
 * @param {object} mapData
 * @param {bool} raw - should return only basic info (id, name, poi category)
 * @returns {object} - promise
 */
function getPoints(conn, mapData, raw) {
	var deferred = Q.defer();

	loadPoints(conn, mapData.id, raw)
		.then(
		function (points) {
			mapData.points = points;
			deferred.resolve(mapData);
		},
		function (error) {
			deferred.reject({
				code: 500,
				message: error
			});
		}
	);
	return deferred.promise;
}

/**
 * @desc Gets points types for map instance
 * @param {object} conn Database connection
 * @param {object} mapData
 * @param {bool} raw - should return only basic data (name, id)
 * @returns {object} - promise
 */
function getTypes(conn, mapData, raw) {
	var deferred = Q.defer();

	loadTypes(conn, mapData.id, raw).then(
		function (points) {
			mapData.types = points;

			deferred.resolve(mapData);
		},
		function (error) {
			deferred.reject({
				code: 500,
				message: error
			});
		}
	);

	return deferred.promise;
}

/**
 * @desc Gets only raw info about points (id, name, desc and poi category)
 * @param {object} conn Database connection
 * @param {object} mapData
 */
function getRawPoints(conn, mapData) {
	return getPoints(conn, mapData, Raw);
}

/**
 * @desc Gets only raw info about point types (id and name)
 * @param {object} conn Database connection
 * @param {object} mapData
 */
function getRawTypes(conn, mapData) {
	return getTypes(conn, mapData, Raw);
}

module.exports = {
	getMapInfo: getMapInfo,
	getPoints: getPoints,
	getRawPoints: getRawPoints,
	getTypes: getTypes,
	getRawTypes: getRawTypes
}