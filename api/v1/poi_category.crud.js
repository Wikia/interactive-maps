'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	poiCategoryMarker = require('./../../lib/poiCategoryMarker'),
	squidUpdate = require('./../../lib/squidUpdate'),

	urlPattern = jsonValidator.getUrlPattern(),

	dbTable = 'poi_category',
	createSchema = {
		description: 'Schema for creating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			map_id: {
				description: 'ID of the map this POI belongs to',
				type: 'integer',
				required: true
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			},
			parent_poi_category_id: {
				description: 'Unique identifier for parent category',
				type: 'integer'
			},
			created_by: {
				description: 'creator user name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			}
		},
		additionalProperties: false
	},
	updateSchema = {
		description: 'Schema for updating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string',
				minLength: 1,
				maxLength: 255
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			},
			parent_poi_category_id: {
				description: 'Unique identifier for parent category',
				type: 'integer'
			}
		},
		additionalProperties: false
	};

/**
 * @desc Handle deleting used categories by moving all points to CatchAll category
 *
 * @param {number} id
 * @param {object} res
 * @param {function} next
 */
function handleUsedCategories(conn, id, res, next) {
	dbCon.update(
		conn,
		'poi', {
			poi_category_id: config.catchAllCategoryId
		}, {
			poi_category_id: id
		}
	).then(
		function (rowsAffected) {
			if (rowsAffected > 0) {
				dbCon.destroy(conn, dbTable, {
					id: id
				}).then(
					function (affectedRows) {
						if (affectedRows > 0) {
							res.send(204, {});
							res.end();
						} else {
							next(
								errorHandler.elementNotFoundError(dbTable, id)
							);
						}
					},
					next
				);
			} else {
				next(errorHandler.elementNotFoundError(dbTable, id));
			}
		},
		next
	);
}

/**
 * @desc Gets map id for a POI category
 *
 * @param {object} conn Database connection
 * @param {integer} poiCategoryId
 */
function getMapId(conn, poiCategoryId) {
	var query = dbCon.knex(dbTable)
			.column(['map_id'])
			.connection(conn)
			.where({
				id: poiCategoryId
			});

	return query.select();
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				dbCon.getConnection(dbCon.connType.all, function (conn) {
					var dbColumns = ['id', 'name', 'marker', 'map_id', 'status'],
						query = dbCon.knex(dbTable).column(dbColumns),

					// check for parameter parentsOnly in URL
						parentsOnly = req.query.hasOwnProperty('parentsOnly');

					if (parentsOnly) {
						query.where({
							parent_poi_category_id: null
						});
					}
					query.connection(conn);

					query.select().then(
						function (collection) {
							utils.handleDefaultMarker(collection);
							utils.convertMarkersNamesToUrls(
								collection,
								config.dfsHost,
								config.bucketPrefix,
								config.markersPrefix
							);
							res.send(200, collection);
							res.end();
						},
						next
					);
				}, next);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, createSchema);

				if (errors.length === 0) {
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						dbCon
							.insert(conn, dbTable, reqBody)
							.then(
								function (data) {
									var id = data[0],
										response = {
											message: 'POI category successfully created',
											id: id,
											url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
										},
										mapId = reqBody.map_id;
									if (reqBody.marker) {
										poiCategoryMarker(id, mapId, reqBody.marker, dbTable);
									}
									utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
										function () {
											squidUpdate.purgeKey(
												utils.surrogateKeyPrefix + mapId, 'poiCategoryCreated');
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
				var id = parseInt(req.pathVar.id, 10),
					filter = {
						id: id
					};
				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						getMapId(conn, id).then(
							function (collection) {
								var mapId = parseInt(collection[0].map_id, 10);

								dbCon
									.destroy(conn, dbTable, filter)
									.then(
									function (affectedRows) {
										if (affectedRows > 0) {
											utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
												function () {
													squidUpdate.purgeKey(
														utils.surrogateKeyPrefix + mapId, 'poiCategoryDeleted');
													res.send(204, {});
													res.end();
												},
												next
											);
										} else {
											next(errorHandler.elementNotFoundError(dbTable, id));
										}
									},
									function (err) {
										// If the delete request results an error, check if the error is reference error
										// (caused by non able to delete foreign key) and handle this case by calling
										// the handleUsedCategories function, otherwise handle the error as regular
										// error
										if (errorHandler.isHandledSQLError(err.clientError.name) &&
											err.clientError.cause.code === 'ER_ROW_IS_REFERENCED_') {
											handleUsedCategories(conn, id, res, next);
										} else {
											next(err);
										}
									}
								);
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
						'name',
						'marker',
						'parent_poi_category_id',
						'status',
						'map_id',
						'created_on',
						'created_by'
					],
					id = parseInt(req.pathVar.id, 10),
					filter = {
						id: id
					};

				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.all, function (conn) {
						dbCon
							.select(conn, dbTable, dbColumns, filter)
							.then(
								function (collection) {
									utils.handleDefaultMarker(collection);
									utils.convertMarkersNamesToUrls(
										collection,
										config.dfsHost,
										config.bucketPrefix,
										config.markersPrefix
									);
									if (collection[0]) {
										res.send(200, collection[0]);
										res.end();
									} else {
										next(errorHandler.elementNotFoundError(dbTable, id));
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
					errors = jsonValidator.validateJSON(reqBody, updateSchema),
					id,
					filter;

				if (errors.length === 0) {
					id = parseInt(req.pathVar.id, 10);
					filter = {
						id: id
					};
					// If new marker is uploaded, reset the marker status to 0
					if (reqBody.marker) {
						reqBody.status = 0;
					}
					if (isFinite(id)) {
						dbCon.getConnection(dbCon.connType.master, function (conn) {
							getMapId(conn, id).then(
								function (collection) {
									var mapId = parseInt(collection[0].map_id, 10);
									dbCon
										.update(conn, dbTable, reqBody, filter)
										.then(
											function (affectedRows) {
												if (affectedRows > 0) {
													var response = {
														message: 'POI category successfully updated',
														id: id,
														url: utils.responseUrl(req, '/api/v1/poi_category/', id)
													};
													if (reqBody.marker) {
														poiCategoryMarker(id, mapId, reqBody.marker, dbTable);
													}
													utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
														function () {
															squidUpdate.purgeKey(
																utils.surrogateKeyPrefix + mapId, 'poiCategoryUpdated');
															res.send(303, response);
															res.end();
														},
														next
													);
												} else {
													next(errorHandler.elementNotFoundError(dbTable, id));
												}
											},
											next
										);
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
