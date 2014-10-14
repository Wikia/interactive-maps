'use strict';

var mapDataConfig = require('./map_data.config'),
	dbCon = require('./../../lib/db_connector'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	Q = require('q');

/**
 * @desc Fetches basic map information from DB
 * @param {Object} conn Database connection
 * @param {Number} mapId
 * @returns {Object} promise
 */
function getMapInfo(conn, mapId) {
	return dbCon
		.select(conn, 'map', mapDataConfig.mapColumns, {
			'id': mapId
		});
}

/**
 * @desc Load Points for map instance
 * @param {Object} conn Database connection
 * @param {Number} mapId
 * @param {Array} columns DB columns to return
 * @returns {Object} - promise
 */
function loadPois(conn, mapId, columns) {
	var x = dbCon.select(
		conn,
		'poi', columns, {
			map_id: mapId
		}
	).then(escapeHTMLInPoiCollection);
	return x;
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
 * @param {Object} conn Database connection
 * @param {Number} mapId
 * @param {Array} columns DB columns to return
 * @returns {Object} - promise
 */
function loadPoiCategories(conn, mapId, columns) {
	return dbCon.select(
		conn,
		'poi_category',
		columns, {
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
 * @param {Object} conn Database connection
 * @param {Object} mapData
 * @param {Array} columns DB columns to return
 * @returns {Object} - promise
 */
function getPois(conn, mapData, columns) {
	var deferred = Q.defer();
	loadPois(conn, mapData.id, columns)
		.then(
			function (points) {
				mapData.pois = points;
				deferred.resolve(mapData);
			})
		.catch (
			function (error) {
				deferred.reject({
					code: 500,
					message: error
				});
			});
	return deferred.promise;
}

/**
 * @desc Gets points types for map instance
 * @param {Object} conn Database connection
 * @param {Object} mapData
 * @param {Array} columns DB columns to return
 * @returns {Object} - promise
 */
function getPoiCategories(conn, mapData, columns) {
	var deferred = Q.defer();

	loadPoiCategories(conn, mapData.id, columns)
		.then(
			function (poiCategories) {
				mapData.poi_categories = poiCategories;
				deferred.resolve(mapData);
			})
		.catch(
			function (error) {
				deferred.reject({
					code: 500,
					message: error
				});
			});

	return deferred.promise;
}

module.exports = {
	getPois: getPois,
	getPoiCategories: getPoiCategories,
	getMapInfo: getMapInfo
};
