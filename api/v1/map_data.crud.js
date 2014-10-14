'use strict';

var dbCon = require('./../../lib/db_connector'),
	mapDataUtils = require('./map_data.utils'),
	mapDataConfig = require('./map_data.config'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils');
/**
 * @desc Entry point handler for extracting metadata associated with the map
 * @param {Object} req
 * @param {Object} res
 */
function getMapData(req, res) {
	var mapId = parseInt(req.pathVar.id, 10) || 0,
		conn;
	if (mapId === 0) {
		errorHandler.serveNotFoundError(req, res);
	}
	dbCon
		.getConnection(dbCon.connType.all)
		.then(function(connection) {
			conn = connection;
			return mapDataUtils.getMapInfo(conn, mapId);
		})
		.then(function(mapData) {
			mapData = mapData[0];
			return mapDataUtils
				.getPois(conn, mapData, mapDataConfig.poiColumns);
		})
		.then(function(mapData) {
			return mapDataUtils
				.getPoiCategories(conn, mapData, mapDataConfig.poiCategoryColumns);
		})
		.then(function (mapData) {
			utils.sendHttpResponse(res, 200, mapData);
		});
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {Object} - CRUD collection
 */
module.exports = function createCRUD() {
	return {
		handler: {
			GET: errorHandler.serveNotFoundError
		},
		wildcard: {
			GET: getMapData
		}
	};
};
