'use strict';

var mapDataConfig = require('./map_data.config'),
	dbCon = require('./../../lib/db_connector'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	Q = require('q');

/**
 * @desc Fetches basic map information from DB
 * @param {object} conn Database connection
 * @param {number} mapId
 * @returns {object} promise
 */
function getMapInfo(conn, mapId) {
	return dbCon
		.select(conn, 'map', mapDataConfig.mapColumns, {
			'id': mapId
		});
}

/**
 * @desc Load Points for map instance
 * @param {object} conn Database connection
 * @param {number} mapId
 * @param {Array} columns DB columns to return
 * @returns {object} - promise
 */
function loadPois(conn, mapId, columns) {
	return dbCon.select(
		conn,
		'poi', columns, {
			map_id: mapId
		}
	).then(escapeHTMLInPoiCollection);
}

/**
 * @desc Escapes HTML in the poi names and descriptions
 * @param {Array} collection
 * @returns {Array}
 */
function escapeHTMLInPoiCollection(collection) {
	collection.forEach(function (item) {
		item.name = utils.escapeHtml(item.name);

		if (item.description) {
			item.description = utils.escapeHtml(item.description);
		}
	});
	return collection;
}

/**
 * @desc Load point types
 * @param {object} conn Database connection
 * @param {number} mapId
 * @param {Array} columns DB columns to return
 * @returns {object} - promise
 */
function loadPoiCategories(conn, mapId, columns) {
	return dbCon.select(
		conn,
		'poi_category',
		columns,
		{
			'map_id': mapId
		}
	).then(
		function (collection) {
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
 * @param {Array} columns DB columns to return
 * @returns {object} - promise
 */
function getPois(conn, mapData, columns) {
	var deferred = Q.defer();
	loadPois(conn, mapData.id, columns)
		.then(
		function (points) {
			mapData.pois = points;
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
 * @param {Array} columns DB columns to return
 * @returns {object} - promise
 */
function getPoiCategories(conn, mapData, columns) {
	var deferred = Q.defer();

	loadPoiCategories(conn, mapData.id, columns).then(
		function (poiCategories) {
			mapData.poi_categories = poiCategories;
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

module.exports = {
	getPois: getPois,
	getPoiCategories: getPoiCategories,
	getMapInfo: getMapInfo
};
