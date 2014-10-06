'use strict';

var dbCon = require('./../../lib/db_connector'),
	poiConfig = require('./poi.config');

/**
 * @desc Helper function to get map_id from poi_id
 *
 * @param {object} conn
 * @param {number} poiId
 * @returns {object}
 */
function getMapIdByPoiId(conn, poiId) {
	return dbCon.select(
		conn,
		poiConfig.dbTable,
		['map_id'],
		{
			id: poiId
		}
	);
}

module.exports = {
	getMapIdByPoiId: getMapIdByPoiId
};
