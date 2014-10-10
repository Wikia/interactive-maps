'use strict';

var mapDataLoader = require('./../../lib/mapDataLoader');

/**
 * @desc Loads map data from DB
 * @param {object} conn
 * @param {number} mapId
 * @returns {object} promise
 */
function loadData(conn, mapId) {
	return mapDataLoader
		.getRawMapInfo(conn, mapId)
		.then(function(mapData) {
			mapData = mapData[0];
			return mapDataLoader.getPois(conn, mapData, true);
		})
		.then(function(mapData) {
			return mapDataLoader.getPoiCategories(conn, mapData, true);
		});
}

module.exports = {
	loadData: loadData
}
