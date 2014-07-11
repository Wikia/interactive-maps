'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	config = require('./../../lib/config'),
	squidUpdate = require('./../../lib/squidUpdate'),

	dbTable = 'map',
	createSchema = {
		description: 'Schema for creating maps',
		type: 'object',
		properties: {
			title: {
				description: 'Map title',
				type: 'string',
				required: true,
				minLength: 1,
				maxLength: 255
			},
			tile_set_id: {
				description: 'Unique identifier for a tile set',
				type: 'integer',
				required: true
			},
			city_id: {
				description: 'ID of the Wikia this map instance belongs to',
				type: 'integer',
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
		description: 'Schema for updating map instance',
		type: 'object',
		properties: {
			title: {
				description: 'Map instance name',
				type: 'string',
				minLength: 1
			},
			deleted: {
				description: 'Map deleted flag',
				type: 'bool'
			}
		},
		additionalProperties: false
	},
	sortingOptions = {
		title_asc: {
			column: 'map.title',
			direction: 'asc'
		},
		updated_on_desc: {
			column: 'map.updated_on',
			direction: 'desc'
		},
		created_on: {
			column: 'map.created_on',
			direction: 'desc'
		}
	};

/**
 * @desc Builds object which is later used in knex.orderBy()
 *       Default value is { column: 'created_on', direction: 'desc' }
 * @param {String} sort description of sorting passed as GET parameter i.e. title_asc
 * @returns {*}
 */
function buildSort(sort) {
	if (sortingOptions.hasOwnProperty(sort)) {
		return sortingOptions[sort];
	}

	// default sorting type
	return sortingOptions.created_on;
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				var cityId = parseInt(req.query.city_id, 10) || 0,
					filter = {
						deleted: false
					},
					sort = buildSort(req.query.sort),
					limit = parseInt(req.query.limit, 10) || false,
					offset = parseInt(req.query.offset, 10) || 0,
					query;

				if (cityId !== 0) {
					filter.city_id = cityId;
				}

				filter.status = utils.tileSetStatus.ok;
				dbCon.getConnection(dbCon.connType.all, function (conn) {
					query = dbCon.knex(dbTable)
						.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
						.column([
							'map.id',
							'map.title',
							'tile_set.image',
							'map.updated_on',
							'tile_set.status',
							'tile_set.id as tile_set_id'
						])
						.where(filter)
						.orderBy(sort.column, sort.direction)
						.connection(conn)
						.select();

					if (limit) {
						query.limit(limit);
						query.offset(offset);
					}

					query.then(
						function (collection) {
							dbCon.knex(dbTable)
								.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
								.count('* as cntr')
								.where(filter)
								.connection(conn)
								.then(
								function (count) {
									collection.forEach(function (value) {
										value.image = utils.imageUrl(
											config.dfsHost,
											utils.getBucketName(
												config.bucketPrefix + config.tileSetPrefix,
												value.tile_set_id
											),
											value.image
										);
										value.url = utils.responseUrl(req, req.route.path, value.id);

										delete value.tile_set_id;
									});

									res.send(200, {
										total: count[0].cntr,
										items: collection
									});
									res.end();
								},
								next
							);
						},
						next
					);
				}, next);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, createSchema);

				if (errors.length === 0) {
					reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');
					dbCon.getConnection(dbCon.connType.master, function (conn) {
						dbCon
							.insert(conn, dbTable, reqBody)
							.then(
								function (data) {
									var id = data[0],
										response = {
											message: 'Map successfully created',
											id: id,
											url: utils.responseUrl(req, req.route.path, id)
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
							.destroy(conn, dbTable, filter)
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
				var dbColumns = ['id', 'title', 'tile_set_id', 'city_id', 'created_by', 'created_on', 'updated_on'],
					id = parseInt(req.pathVar.id, 10),
					filter = {
						id: id,
						deleted: false
					};

				if (isFinite(id)) {
					dbCon.getConnection(dbCon.connType.all, function (conn) {
						dbCon
							.select(conn, dbTable, dbColumns, filter)
							.then(
								function (collection) {
									var obj = collection[0];

									if (obj) {
										obj.tile_set_url = utils.responseUrl(req, '/api/v1/tile_set', obj.tile_set_id);
										res.send(200, obj);
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

					if (isFinite(id)) {
						reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');
						dbCon.getConnection(dbCon.connType.master, function (conn) {
							dbCon
								.update(conn, dbTable, reqBody, filter)
								.then(
									function (affectedRows) {
										if (affectedRows > 0) {
											var response = {
												message: 'Map successfully updated',
												id: id,
												url: utils.responseUrl(req, '/api/v1/map', id)
											};

											res.send(303, response);
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

				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		}
	};
};
