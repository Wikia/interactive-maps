'use strict';

var dbCon = require('./../../lib/db_connector'),
	mapDataLoader = require('./../../lib/mapDataLoader'),
	utils = require('./../../lib/utils');

/**
 * @desc Loads map data from DB
 * @param {object} conn
 * @param {number} mapId
 * @returns {object} promise
 */
function loadData(conn, mapId) {
	return mapDataLoader
		.getRawMapInfo(conn, mapId)
		.then(function(mapData){
			mapData = mapData[0];
			return mapDataLoader
				.getPois(conn, mapData, true)
				.then(function(mapData) {
					return mapDataLoader.getPoiCategories(conn, mapData, true);
				});
		});
}

/**
 * @desc Entry point handler for extracting metadata associated with the map
 * @param {object} req
 * @param {object} res
 */
function getMapData(req, res) {
	var mapId = parseInt(req.pathVar.id, 10) || 0;
	if (mapId !== 0) {
		dbCon.getConnection(dbCon.connType.all, function(conn) {
			onConnection(conn, mapId, res);
		});
	}
}

/**
 * @desc Callback after a connection to DB is established
 * @param {object} conn Database connection
 * @param {number} mapId
 * @param {object} res Express response
 */
function onConnection(conn, mapId, res) {
	loadData(conn, mapId)
		.then(function (mapData) {
			utils.sendHttpResponse(res, 200, mapData);
		});
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */
module.exports = function createCRUD() {
	return {
		handler: {},
		wildcard: {
			GET: getMapData
		}
	};
};
