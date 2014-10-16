'use strict';

var config = require('./config'),
	dbCon = require('./db_connector'),
	utils = require('./utils'),
	renderConfig = require('./renderMap.config.js');

/**
 * @desc Load Map instance
 * @param {Object} conn Database connection
 * @param {Number} mapId
 * @returns {Object} - promise
 */
function getMapInfo(conn, mapId) {
	return dbCon.knex('map')
		.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
		.column(renderConfig.mapColumns)
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
 * @desc Handles default markers and converts marker names to urls
 * @param {Array} poiCategories
 */
function setupMarkers(poiCategories){
	utils.handleDefaultMarker(poiCategories);
	utils.convertMarkersNamesToUrls(poiCategories, config.dfsHost, config.bucketPrefix, config.markersPrefix);
}

module.exports = {
	getMapInfo: getMapInfo,
	setupMarkers: setupMarkers
};
