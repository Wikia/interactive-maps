'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	squidUpdate = require('./../../lib/squidUpdate'),
	poiIndexer = require('./../../lib/poiIndexer'),

	urlPattern = jsonValidator.getOptionalUrlPattern(),

	dbTable = 'poi',
	createSchema = {
		description: 'Schema for creating POI',
		type: 'Object',
		properties: {
			name: {
				description: 'POI name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			poi_category_id: {
				description: 'Unique identifier for category',
				type: 'integer',
				required: true
			},
			map_id: {
				description: 'Unique identifier for map',
				type: 'integer',
				required: true
			},
			description: {
				description: 'POI description',
				type: 'string',
				minLength: 1,
				maxLength: 500
			},
			link: {
				description: 'Link to article connected with this POI',
				type: 'string',
				pattern: urlPattern
			},
			link_title: {
				description: 'Title of the article connected with this POI',
				type: 'string'
			},
			photo: {
				description: 'Link photo connected with this POI',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			},
			lat: {
				description: 'POI latitude',
				type: 'number',
				required: true
			},
			lon: {
				description: 'POI longitude',
				type: 'number',
				required: true
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
		description: 'Schema for updating POI',
		type: 'Object',
		properties: {
			name: {
				description: 'POI name',
				type: 'string',
				minLength: 1,
				maxLength: 255
			},
			poi_category_id: {
				description: 'Unique identifier for category',
				type: 'integer'
			},
			description: {
				description: 'POI description',
				type: 'string',
				minLength: 1
			},
			link: {
				description: 'Link to article connected with this POI',
				type: 'string',
				pattern: urlPattern,
				format: 'uri'
			},
			link_title: {
				description: 'Title of the article connected with this POI',
				type: 'string'
			},
			photo: {
				description: 'Link photo connected with this POI',
				type: 'string',
				pattern: urlPattern,
				format: 'uri',
				maxLength: 255
			},
			lat: {
				description: 'POI latitude',
				type: 'number'
			},
			lon: {
				description: 'POI longitude',
				type: 'number'
			},
			updated_by: {
				description: 'Editor user name',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			}
		},
		additionalProperties: false
	};

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
						.select(conn, dbTable, dbColumns)
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
					errors = jsonValidator.validateJSON(reqBody, createSchema);

				if (errors.length === 0) {
					// extend data object
					reqBody.updated_by = reqBody.created_by;
					reqBody.created_on = dbCon.knex.raw('CURRENT_TIMESTAMP');
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						dbCon
							.insert(conn, dbTable, reqBody)
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
											poiIndexer.addPoiDataToQueue(conn, poiIndexer.poiOperations.insert, id);
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
						utils.getMapIdByPoiId(conn, dbCon, id).then(
							function (rows) {
								if (rows.length > 0) {
									var mapId = rows[0].map_id;

									dbCon
										.destroy(conn, dbTable, filter)
										.then(
											function () {
												utils.changeMapUpdatedOn(conn, dbCon, mapId).then(
													function () {
														squidUpdate.purgeKey(
															utils.surrogateKeyPrefix + mapId,
															'mapPoiDeleted'
														);
														poiIndexer.addPoiDataToQueue(
															conn,
															poiIndexer.poiOperations.delete,
															id
														);
														res.send(204, {});
														res.end();
													},
													next
												);
											},
											next
									);
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
							.select(conn, dbTable, dbColumns, filter)
							.then(
							function (collection) {
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
					filter,
					mapId;

				if (errors.length === 0) {
					id = parseInt(req.pathVar.id);
					filter = {
						id: id
					};

					if (isFinite(id)) {
						dbCon.getConnection(dbCon.connType.master, function (conn) {
							utils.getMapIdByPoiId(conn, dbCon, id).then(
								function (rows) {
									if (rows.length > 0) {
										mapId = rows[0].map_id;
										dbCon
											.update(conn, dbTable, reqBody, filter)
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
															poiIndexer.addPoiDataToQueue(
																conn,
																poiIndexer.poiOperations.update,
																id
															);
															res.send(303, response);
															res.end();
														},
														next
													);
												},
												next
										);
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

				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		}
	};
};
