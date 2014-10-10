'use strict';

var dbCon = require('./../../lib/db_connector'),
	mapDataUtils = require('./map_data.utils'),
	utils = require('./../../lib/utils');
/**
 * @desc Entry point handler for extracting metadata associated with the map
 * @param {object} req
 * @param {object} res
 */
function getMapData(req, res) {
	var mapId = parseInt(req.pathVar.id, 10) || 0;
	if (mapId !== 0) {
		dbCon
			.getConnection(dbCon.connType.all)
			.then(function(conn){
				return mapDataUtils.loadData(conn, mapId);
			})
			.then(function (mapData) {
				utils.sendHttpResponse(res, 200, mapData);
			});
	}
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
