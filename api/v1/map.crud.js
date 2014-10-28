'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	squidUpdate = require('./../../lib/squidUpdate'),
	mapConfig = require('./map.config'),
	mapDataConfig = require('./map_data.config'),
	mapUtils = require('./map.utils'),
	crudUtils = require('./crud.utils');

/**
 * @desc Returns a collection of maps' data
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function getMapsCollection(req, res, next) {
	var cityId = parseInt(req.query.city_id, 10) || 0,
		filter = {
			deleted: 0
		},
		sort = mapUtils.buildSort(req.query.sort),
		limit = parseInt(req.query.limit, 10) || false,
		offset = parseInt(req.query.offset, 10) || 0,
		tileSetStatuses = [utils.tileSetStatus.ok],
		dbConnection,
		mapsList;

	if (cityId !== 0) {
		filter.city_id = cityId;
		// Add private maps for single wiki maps list
		tileSetStatuses.push(utils.tileSetStatus.private);
	}

	// If deleted parameter is passed in the request, return only deleted maps
	if (typeof req.query.deleted !== 'undefined') {
		filter.deleted = 1;
	}

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			var query = mapUtils.getMapsCollectionQuery(conn, filter, tileSetStatuses, sort);
			dbConnection = conn;

			if (limit) {
				crudUtils.addPaginationToQuery(query, limit, offset);
			}

			return query.select();
		})
		.then(function (collection) {
			mapsList = collection;
			return mapUtils.getMapsCountQuery(dbConnection, filter, tileSetStatuses).count('* as cntr');
		})
		.then(function (count) {
			dbConnection.release();

			res.setCacheValidity(mapConfig.cacheValidity.handler);
			res.setSurrogateKey(utils.surrogateKeyPrefix + mapConfig.surrogateKeys.handler);
			utils.sendHttpResponse(res, 200, {
				total: count[0].cntr,
				items: mapUtils.buildMapCollectionResult(mapsList, req)
			});
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc Created a map
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function createMap(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		response = {
			message: mapConfig.responseMessages.created
		},
		dbConnection;

	crudUtils.validateData(reqBody, mapConfig.createSchema);
	reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return dbCon.insert(conn, mapConfig.dbTable, reqBody);
		})
		.then(function (data) {
			var mapId = data[0];

			dbConnection.release();

			utils.extendObject(response, {
				id: mapId,
				url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), mapId)
			});

			utils.sendHttpResponse(res, 201, response);
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapConfig.surrogateKeys.handler, mapConfig.purgeCallers.created);
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc Deletes a map
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function deleteMap(req, res, next) {
	var mapId = req.pathVar.id,
		filter,
		dbConnection;

	crudUtils.validateIdParam(mapId);
	mapId = parseInt(mapId, 10);
	filter = {
		id: mapId
	};

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return dbCon.destroy(conn, mapConfig.dbTable, filter);
		})
		.then(function (affectedRows) {
			dbConnection.release();
			crudUtils.throwErrorIfNoRowsAffected(affectedRows, mapConfig, mapId);
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'mapDeleted');
			utils.sendHttpResponse(res, 200, {
				message: mapConfig.responseMessages.deleted,
				id: mapId
			});
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapConfig.surrogateKeys.handler, mapConfig.purgeCallers.deleted);
			squidUpdate.purgeUrls(
				[
					utils.responseUrl(req, crudUtils.apiPath + mapConfig.path, mapId),
					utils.responseUrl(req, crudUtils.apiPath + mapDataConfig.path, mapId)
				],
				mapConfig.purgeCallers.deleted
			);
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc Retrieves and returns a map's data
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function getMap(req, res, next) {
	var mapId = req.pathVar.id,
		filter,
		dbConnection;

	crudUtils.validateIdParam(mapId);
	mapId = parseInt(mapId, 10);
	filter = {
		id: mapId
	};

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			dbConnection = conn;
			return dbCon.select(conn, mapConfig.dbTable, mapConfig.mapColumns, filter);
		})
		.then(function (data) {
			var mapData = data[0];

			dbConnection.release();

			if (!mapData) {
				throw errorHandler.elementNotFoundError(mapConfig.dbTable, mapId);
			}

			utils.extendObject(mapData, {
				tile_set_url: utils.responseUrl(req, '/api/v1/tile_set/', mapData.tile_set_id)
			});

			res.setCacheValidity(mapConfig.cacheValidity.wildcard);
			utils.sendHttpResponse(res, 200, mapData);
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc Updates data of a map which id was passed
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function updateMap(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		response = {
			message: mapConfig.responseMessages.updated
		},
		mapId = req.pathVar.id,
		filter,
		dbConnection;

	crudUtils.validateData(reqBody, mapConfig.updateSchema);
	crudUtils.validateIdParam(mapId);
	mapId = parseInt(mapId, 10);
	filter = {
		id: mapId
	};

	utils.extendObject(reqBody, {
		updated_on: dbCon.raw('CURRENT_TIMESTAMP')
	});

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return dbCon.update(conn, mapConfig.dbTable, reqBody, filter);
		})
		.then(function (affectedRows) {
			var responseUrl = utils.responseUrl(req, crudUtils.apiPath + mapConfig.path, mapId);

			dbConnection.release();
			crudUtils.throwErrorIfNoRowsAffected(affectedRows, mapConfig, mapId);
			utils.extendObject(response, {
				id: mapId,
				url: responseUrl
			});

			utils.sendHttpResponse(res, 303, response);

			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapConfig.surrogateKeys.handler, mapConfig.purgeCallers.updated);
			squidUpdate.purgeUrls(
				[
					responseUrl,
					utils.responseUrl(req, crudUtils.apiPath + mapDataConfig.path, mapId)
				],
				mapConfig.purgeCallers.deleted
			);
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */
module.exports = function createCRUD() {
	return {
		handler: {
			GET: getMapsCollection,
			POST: createMap
		},
		wildcard: {
			DELETE: deleteMap,
			GET: getMap,
			PUT: updateMap
		}
	};
};
