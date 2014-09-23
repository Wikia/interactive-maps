'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	squidUpdate = require('./../../lib/squidUpdate'),
	taskQueue = require('./../../lib/taskQueue'),
	logger = require('./../../lib/logger'),
	poiConfig = require('./poi.config'),
	jsonValidator = require('./../../lib/jsonValidator');

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

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				var dbColumns = ['id', 'name'];
				dbCon.getConnection(dbCon.connType.all, function (conn) {
					dbCon
						.select(conn, poiConfig.dbTable, dbColumns)
						.then(
						function (collection) {
							res.send(200, collection);
							res.end();
						},
						next
					);
				}, next);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, poiConfig.createSchema);

				if (errors.length === 0) {
					// extend data object
					reqBody.updated_by = reqBody.created_by;
					reqBody.created_on = dbCon.knex.raw('CURRENT_TIMESTAMP');
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						dbCon
							.insert(conn, poiConfig.dbTable, reqBody)
							.then(
								function (data) {
									var id = data[0],
										response = {
											message: 'POI successfully created',
											id: id,
											url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
										},
										mapId = reqBody.map_id;
									utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
										function () {
											squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'mapPoiCreated');
											addPoiDataToQueue(conn, poiConfig.poiOperations.insert, id);
											res.send(201, response);
											res.end();
										},
										next
									);
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
				var id = parseInt(req.pathVar.id),
					filter = {
						id: id
					};
				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						getMapIdByPoiId(conn, id).then(
							function (rows) {
								if (rows.length > 0) {
									var mapId = rows[0].map_id;

									dbCon
										.destroy(conn, poiConfig.dbTable, filter)
										.then(
											function () {
												utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
													function () {
														squidUpdate.purgeKey(
															utils.surrogateKeyPrefix + mapId,
															'mapPoiDeleted'
														);
														addPoiDataToQueue(conn, poiConfig.poiOperations.delete, id);
														res.send(204, {});
														res.end();
													},
													next
												);
											},
											next
									);
								} else {
									next(errorHandler.elementNotFoundError(poiConfig.dbTable, id));
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
				var dbColumns = ['name', 'poi_category_id', 'description', 'link', 'link_title', 'photo', 'lat', 'lon',
						'created_on', 'created_by', 'updated_on', 'updated_by', 'map_id'
					],
					id = parseInt(req.pathVar.id),
					filter = {
						id: id
					};

				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.all, function (conn) {
						dbCon
							.select(conn, poiConfig.dbTable, dbColumns, filter)
							.then(
							function (collection) {
								if (collection[0]) {
									res.send(200, collection[0]);
									res.end();
								} else {
									next(errorHandler.elementNotFoundError(poiConfig.dbTable, id));
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
					errors = jsonValidator.validateJSON(reqBody, poiConfig.updateSchema),
					id,
					filter,
					mapId;

				if (errors.length === 0) {
					id = parseInt(req.pathVar.id);
					filter = {
						id: id
					};

					if (isFinite(id)) {
						dbCon.getConnection(dbCon.connType.master, function (conn) {
							getMapIdByPoiId(conn, id).then(
								function (rows) {
									if (rows.length > 0) {
										mapId = rows[0].map_id;
										dbCon
											.update(conn, poiConfig.dbTable, reqBody, filter)
											.then(
												function () {
													var response = {
														message: 'POI successfully updated',
														id: id,
														url: utils.responseUrl(req, '/api/v1/poi/', id)
													};
													utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
														function () {
															squidUpdate.purgeKey(
																utils.surrogateKeyPrefix + mapId,
																'mapPoiUpdated'
															);
															addPoiDataToQueue(conn, poiConfig.poiOperations.update, id);
															res.send(303, response);
															res.end();
														},
														next
													);
												},
												next
										);
									} else {
										next(errorHandler.elementNotFoundError(poiConfig.dbTable, id));
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
