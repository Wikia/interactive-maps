'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	squidUpdate = require('./../../lib/squidUpdate'),
	poiConfig = require('./poi.config'),
	poiUtils = require('./poi.utils'),
	jsonValidator = require('./../../lib/jsonValidator');

/**
 * @desc CRUD function for listing collection of all POIs
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next callback for express.js
 */
function getPoisCollection(req, res, next) {
	var dbColumns = ['id', 'name'];

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return dbCon.select(conn, poiConfig.dbTable, dbColumns);
		})
		.then(function (collection) {
			utils.sendHttpResponse(res, 200, collection);
		})
		.fail(next);
}

/**
 * @desc CRUD function for creating new POI
 * @param {Object} req - HTTP request objectdeletePoi,
 * @param {Object} res - HTTP response object
 * @param {Function} next callback for express.js
 */
function createPoi(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		mapId = reqBody.map_id,
		response = {
			message: 'POI successfully created'
		},
		dbConnection,
		poiId;

	poiUtils.validatePoiCreation(reqBody);

	utils.extendObject(reqBody, {
		updated_by: reqBody.created_by,
		created_on: dbCon.knex.raw('CURRENT_TIMESTAMP')
	});

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return dbCon.insert(conn, poiConfig.dbTable, reqBody);
		})
		.then(function (data) {
			poiId = data[0];

			utils.extendObject(response, {
				id: poiId,
				created_on: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), poiId)
			});

			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		})
		.then(function () {
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'mapPoiCreated');
			poiUtils.addPoiDataToQueue(dbConnection, poiConfig.poiOperations.insert, poiId);
			utils.sendHttpResponse(res, 201, response);
		})
		.fail(next);
}

/**
 * @desc CRUD function for listing a POI data
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next callback for express.js
 */
function getPoi(req, res, next) {
	var dbColumns = ['name', 'poi_category_id', 'description', 'link', 'link_title', 'photo', 'lat', 'lon',
			'created_on', 'created_by', 'updated_on', 'updated_by', 'map_id'
		],
		poiIdParam = req.pathVar.id,
		poiId = parseInt(poiIdParam),
		filter = {
			id: poiId
		};

	poiUtils.validatePoiId(poiId, poiIdParam);

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return dbCon.select(conn, poiConfig.dbTable, dbColumns, filter);
		})
		.then(function (data) {
			if (!data[0]) {
				return errorHandler.elementNotFoundError(poiConfig.dbTable, poiId);
			}

			utils.sendHttpResponse(res, 200, data[0]);
		})
		.fail(next);
}

/**
 * @desc CRUD function for deleting a POI
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next callback for express.js
 */
function deletePoi(req, res, next) {
	var poiIdParam = req.pathVar.id,
		poiId = parseInt(poiIdParam),
		filter = {
			id: poiId
		},
		dbConnection,
		mapId;

	poiUtils.validatePoiId(poiId, poiIdParam);

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return poiUtils.getMapIdByPoiId(conn, poiId);
		})
		.then(function (rows) {
			if (rows.length <= 0) {
				throw errorHandler.elementNotFoundError(poiConfig.dbTable, poiId);
			}

			mapId = rows[0].map_id;
			return dbCon.destroy(dbConnection, poiConfig.dbTable, filter);
		})
		.then(function () {
			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		})
		.then(function () {
			squidUpdate.purgeKey(
				utils.surrogateKeyPrefix + mapId,
				'mapPoiDeleted'
			);
			poiUtils.addPoiDataToQueue(dbConnection, poiConfig.poiOperations.delete, poiId);
			utils.sendHttpResponse(res, 204, {});
		})
		.fail(next);
}

/**
 * @desc CRUD function for updating a POI
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next callback for express.js
 */
function updatePoi(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		errors = jsonValidator.validateJSON(reqBody, poiConfig.updateSchema),
		poiIdParam = req.pathVar.id,
		poiId = parseInt(poiIdParam, 10),
		filter = {
			id: poiId
		},
		mapId,
		dbConnection,
		response = {
			message: 'POI successfully updated',
			id: poiId
		};

	if (errors.length > 0) {
		throw errorHandler.badRequestError(errors);
	}

	poiUtils.validatePoiId(poiId, poiIdParam);

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return poiUtils.getMapIdByPoiId(dbConnection, poiId);
		})
		.then(function (rows) {
			if (rows.length <= 0) {
				throw errorHandler.elementNotFoundError(poiConfig.dbTable, poiId);
			}

			mapId = rows[0].map_id;
			return dbCon.update(dbConnection, poiConfig.dbTable, reqBody, filter);
		})
		.then(function () {
			response.url = utils.responseUrl(req, '/api/v1/poi/', poiId);
			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		})
		.then(function () {
			squidUpdate.purgeKey(
				utils.surrogateKeyPrefix + mapId,
				'mapPoiUpdated'
			);
			poiUtils.addPoiDataToQueue(dbConnection, poiConfig.poiOperations.update, poiId);
			res.send(303, response);
			res.end();
		})
		.fail(next);
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */
module.exports = function createCRUD() {
	return {
		handler: {
			GET: getPoisCollection,
			POST: createPoi
		},
		wildcard: {
			DELETE: deletePoi,
			GET: getPoi,
			PUT: updatePoi
		}
	};
};
