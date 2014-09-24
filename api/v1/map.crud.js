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
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: getMapsCollection,
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, mapConfig.createSchema);

				if (errors.length === 0) {
					reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						dbCon
							.insert(conn, mapConfig.dbTable, reqBody)
							.then(
								function (data) {
									var id = data[0],
										response = {
											message: 'Map successfully created',
											id: id,
											url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
										};

									res.send(201, response);
									res.end();
								},
								next
						);
					}, next);
				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		},
		wildcard: {
			DELETE: function (req, res, next) {
				var id = parseInt(req.pathVar.id, 10),
					filter = {
						id: id
					};
				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						dbCon
							.destroy(conn, mapConfig.dbTable, filter)
							.then(
								function (affectedRows) {
									if (affectedRows > 0) {
										squidUpdate.purgeKey(utils.surrogateKeyPrefix + id, 'mapDeleted');
										res.send(204, {
											message: 'Map successfully deleted',
											id: id
										});
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
			},
			GET: function (req, res, next) {
				var dbColumns = [
						'id',
						'title',
						'tile_set_id',
						'city_id',
						'created_by',
						'created_on',
						'updated_on',
						'deleted'

					],
					id = parseInt(req.pathVar.id, 10),
					filter = {
						id: id
					};

				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.all, function (conn) {
						dbCon
							.select(conn, mapConfig.dbTable, dbColumns, filter)
							.then(
								function (collection) {
									var obj = collection[0];

									if (obj) {
										obj.tile_set_url = utils.responseUrl(req, '/api/v1/tile_set/', obj.tile_set_id);
										res.send(200, obj);
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
			},
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
