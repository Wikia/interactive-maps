'use strict';

var Q = require('q'),
	dbCon = require('./db_connector'),
	taskQueue = require('./taskQueue'),
	logger = require('./logger'),

	poiOperations = {
		insert: 'insert',
		update: 'update',
		'delete': 'delete'
	};

/**
 * @desc Collect poi data for search indexing
 * @param {Object} conn - Database connection
 * @param {Number} poiId - Poi id
 * @returns {Object}
 */
function collectPoiData(conn, poiId) {
	return dbCon.knex('poi')
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
 * @desc creates context object
 * @param {String} operation - POI Operation defined in poiOperations
 * @param {Array} poiData - poiObject
 * @returns {Object}
 */
function createContextObject(operation, poiData) {
	return {
		operation: operation,
		data: poiData
	};
}

/**
 * @desc Creates payload context object based on operation type
 * @param {Object} conn - Database connection
 * @param {String} operation - POI Operation defined in poiOperations
 * @param {Number} poiId - Poi id
 * @return {Object} - promise
 */
function createPayLoadContext(conn, operation, poiId) {
	var deferred = Q.defer(),
		errorMsg = 'POI ' + poiId + ' not found in database',
		context;

	if (operation === poiOperations.delete) {
		context = createContextObject(operation, [
			{
				id: poiId
			}
		]);
		deferred.resolve(context);
	} else {
		collectPoiData(conn, poiId).then(function (poiData) {
			if (poiData.length > 0) {
				context = createContextObject(operation, poiData);
				deferred.resolve(context);
			}
			else {
				logger.error(errorMsg);
				deferred.reject(new Error(errorMsg));
			}
		});
	}

	return deferred.promise;
}

/**
 * @desc sets task creator
 * @param {String} operation - POI Operation defined in poiOperations
 * @param {Object} poi - poi object
 * @returns {string}
 */
function setTaskCreator(operation, poi) {
	var creator = '';

	if (operation === poiOperations.insert) {
		creator = poi.created_by;
	} else if (operation === poiOperations.update) {
		creator = poi.updated_by;
	}

	return creator;
}

/**
 * @desc creates payloadObject
 * @param {String} workId
 * @param {String} creator
 * @param {Object} context
 * @returns {Object}
 */
function createPayLoadObject(workId, creator, context) {
	return taskQueue.payload(
		taskQueue.tasks.poiUpdate,
		creator,
		workId,
		context
	);
}

/**
 * @desc Send poi data to search processing queue
 * @param {Object} conn - Database connection
 * @param {String} operation - POI Operation defined in poiOperations
 * @param {Number} poiId - Poi id
 */
function addPoiDataToQueue(conn, operation, poiId, callback) {
	createPayLoadContext(conn, operation, poiId).then(function (context) {
		console.log('context');
		taskQueue.publish(
			createPayLoadObject(operation + poiId, setTaskCreator(operation, context.data[0]), context),
			callback
		);
	});
}

module.exports = {
	addPoiDataToQueue: addPoiDataToQueue,
	poiOperations: poiOperations
};
