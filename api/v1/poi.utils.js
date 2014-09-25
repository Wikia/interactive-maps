'use strict';

var dbCon = require('./../../lib/db_connector'),
	taskQueue = require('./../../lib/taskQueue'),
	logger = require('./../../lib/logger'),
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

/**
 * @desc Collect poi data for search indexing
 *
 * @param {object} conn Database connection
 * @param {number} poiId Poi id
 * @returns {object}
 */
function collectPoiData(conn, poiId) {
	return dbCon.knex(poiConfig.dbTable)
		.select(
			'poi.id',
			'poi.name',
			'poi.description',
			'poi.link',
			'poi.photo',
			'poi.lat',
			'poi.lon',
			dbCon.raw('UNIX_TIMESTAMP(poi.created_on) AS created_on'),
			'poi.created_by',
			dbCon.raw('UNIX_TIMESTAMP(poi.updated_on) AS updated_on'),
			'poi.updated_by',
			'poi.link_title',
			'poi.poi_category_id',
			'poi_category.name AS poi_category_name',
			'poi_category.parent_poi_category_id',
			'poi.map_id',
			'map.city_id',
			'map.tile_set_id',
			dbCon.raw('UNIX_TIMESTAMP(map.created_on) AS map_created_on'),
			'map.created_by AS map_created_by'
		)
		.join('poi_category', 'poi.poi_category_id', '=', 'poi_category.id')
		.join('map', 'poi.map_id', '=', 'map.id')
		.connection(conn)
		.where('poi.id', poiId);
}

/**
 * @desc Send poi data to search processing queue
 *
 * @param {object} conn Database connection
 * @param {string} operation POI Operation defined in poiOperations
 * @param {number} poiId Poi id
 */
function addPoiDataToQueue(conn, operation, poiId) {
	var workId = operation + poiId,
		context;
	if (operation === poiConfig.poiOperations.delete) {
		context = {
			operation: operation,
			data: [
				{
					id: poiId
				}
			]
		};
		taskQueue.publish(taskQueue.payload(
			taskQueue.tasks.poiUpdate,
			'',
			workId,
			context
		));
	} else {
		collectPoiData(conn, poiId).then(function (poiData) {
			var row;
			if (poiData.length > 0) {
				row = poiData[0];
				context = {
					operation: operation,
					data: poiData
				};
				taskQueue.publish(taskQueue.payload(
					taskQueue.tasks.poiUpdate,
					poiConfig.poiOperations.insert === operation ? row.created_by : row.updated_by,
					workId,
					context
				));
			} else {
				logger.error('POI ' + poiId + ' not found in database');
			}
		});
	}
}

module.exports = {
	getMapIdByPoiId: getMapIdByPoiId,
	addPoiDataToQueue: addPoiDataToQueue
};
