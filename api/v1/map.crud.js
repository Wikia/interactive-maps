'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	squidUpdate = require('./../../lib/squidUpdate'),
	mapConfig = require('./map.config'),
	mapUtils = require('./map.utils');

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
				query.limit(limit);
				query.offset(offset);
			}

			return query;
		})
		.then(function (collection) {
			mapsList = collection;
			return dbCon.knex(mapConfig.dbTable)
				.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
				.count('* as cntr')
				.where(filter)
				.whereIn('tile_set.status', tileSetStatuses)
				.connection(dbConnection);
		})
		.then(function (count) {
			utils.sendHttpResponse(res, 200, {
				total: count[0].cntr,
				items: mapUtils.buildMapCollectionResult(mapsList, req)
			});
		})
		.fail(next);
}

/**
 * @desc Created a map
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function createMap(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		errors = jsonValidator.validateJSON(reqBody, mapConfig.createSchema),
		response = {
			message: 'Map successfully created'
		};

	if (errors.length > 0) {
		throw errorHandler.badRequestError(errors);
	}

	reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			return dbCon.insert(conn, mapConfig.dbTable, reqBody);
		})
		.then(function (data) {
			var mapId = data[0];

			utils.extendObject(response, {
				id: mapId,
				url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), mapId)
			});

			utils.sendHttpResponse(res, 200, response);
		})
		.fail(next);
}

/**
 * @desc Deletes a map
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function deleteMap(req, res, next) {
	var mapIdParam = req.pathVar.id,
		mapId = parseInt(mapIdParam, 10),
		filter = {
			id: mapId
		};

	mapUtils.validateMapId(mapId, mapIdParam);

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			return dbCon.destroy(conn, mapConfig.dbTable, filter);
		})
		.then(function (affectedRows) {
			if (affectedRows <= 0) {
				throw errorHandler.elementNotFoundError(mapConfig.dbTable, mapId);
			}

			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'mapDeleted');
			utils.sendHttpResponse(res, 204, {
				message: 'Map successfully deleted',
				id: mapId
			});
		})
		.fail(next);
}

/**
 * @desc Retrieves and returns a map's data
 * @param {object} req HTTP request object
 * @param {object} res HTTP request object
 * @param {function} next callback for express.js
 */
function getMap(req, res, next) {
	var mapIdParam = req.pathVar.id,
		mapId = parseInt(mapIdParam, 10),
		filter = {
			id: mapId
		},
		mapData;

	mapUtils.validateMapId(mapId, mapIdParam);

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return dbCon.select(conn, mapConfig.dbTable, mapConfig.mapColumns, filter);
		})
		.then(function (data) {
			if (!data[0]) {
				throw errorHandler.elementNotFoundError(mapConfig.dbTable, mapId);
			}

			mapData = data[0];
			utils.extendObject(mapData, {
				tile_set_url: utils.responseUrl(req, '/api/v1/tile_set/', mapData.tile_set_id)
			});
			utils.sendHttpResponse(res, 200, mapData);
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
			GET: getMapsCollection,
			POST: createMap
		},
		wildcard: {
			DELETE: deleteMap,
			GET: getMap,
			PUT: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, mapConfig.updateSchema),
					id,
					filter;

				if (errors.length === 0) {
					id = parseInt(req.pathVar.id, 10);
					filter = {
						id: id
					};

					if (isFinite(id)) {
						reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');
						dbCon.getConnection(dbCon.connType.master, function (conn) {
							dbCon
								.update(conn, mapConfig.dbTable, reqBody, filter)
								.then(
									function (affectedRows) {
										if (affectedRows > 0) {
											var response = {
												message: 'Map successfully updated',
												id: id,
												url: utils.responseUrl(req, '/api/v1/map/', id)
											};

											res.send(303, response);
											res.end();
										} else {
											next(errorHandler.elementNotFoundError(mapConfig.dbTable, id));
										}
									},
									next
							);
						}, next);
					} else {
						next(errorHandler.badNumberError(req.pathVar.id));
					}

				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		}
	};
};
