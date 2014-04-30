'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	config = require('./../../lib/config'),

	dbTable = 'map',
	createSchema = {
		description: 'Schema for creating maps',
		type: 'object',
		properties: {
			title: {
				description: 'Map title',
				type: 'string',
				required: true
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
				required: true
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
				minLength: 2
			}
		},
		additionalProperties: false
	};

/**
 * @desc Builds object which is later used in knex.orderBy()
 *       Default value is { column: 'created_on', direction: 'desc' }
 * @param {String} sort description of sorting passed as GET parameter i.e. title_asc
 * @returns {*}
 */
function buildSort( sort ) {
	switch(sort) {
		case 'title_asc':
			sort = {
				column: 'map.title',
				direction: 'asc'
			};
			break;
		case 'updated_on_desc':
			sort = {
				column: 'map.updated_on',
				direction: 'desc'
			};
			break;
		default:
			sort = {
				column: 'map.created_on',
				direction: 'desc'
			};
			break;
	}

	return sort;
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
					filter = {},
					sort = buildSort( req.query.sort );

				if (cityId !== 0) {
					filter.city_id = cityId;
					filter.status = utils.tileSetStatus.ok;
				}

				dbCon.knex(dbTable)
					.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
					.column([
						'map.id',
						'map.title',
						'tile_set.name',
						'tile_set.image',
						'map.updated_on',
						'tile_set.status'
					])
					.where(filter)
					.orderBy(sort.column, sort.direction)
					.select()
					.then(
						function (collection) {
							collection.forEach(function (value) {
								// TODO: fix hardcoded DFS host
								value.image = 'http://s3.dev-dfs-s1/' +
									utils.getBucketName(config.bucketPrefix, value.name) + '/' + value.image;
								value.url = utils.responseUrl(req, req.route.path, value.id);

								delete value.name;
							});

							res.send(200, collection);
							res.end();
						},
						next
				);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, createSchema);

				if (errors.length === 0) {
					reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');
					dbCon
						.insert(dbTable, reqBody)
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
					dbCon
						.destroy(dbTable, filter)
						.then(
							function (affectedRows) {
								if (affectedRows > 0) {
									res.send(204, {});
									res.end();
								} else {
									next(errorHandler.elementNotFoundError(dbTable, id));
								}
							},
							next
					);
				} else {
					next(errorHandler.badNumberError(req.pathVar.id));
				}
			},
			GET: function (req, res, next) {
				var dbColumns = ['title', 'tile_set_id', 'city_id', 'created_by', 'created_on', 'updated_on'],
					id = parseInt(req.pathVar.id, 10),
					filter = {
						id: id
					};

				if (isFinite(id)) {
					dbCon
						.select(dbTable, dbColumns, filter)
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
				} else {
					next(errorHandler.badNumberError(req.pathVar.id));
				}
			},
			PUT: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, updateSchema);

				if (errors.length === 0) {
					var id = parseInt(req.pathVar.id, 10),
						filter = {
							id: id
						};

					if (isFinite(id)) {
						reqBody.updated_on = dbCon.raw('CURRENT_TIMESTAMP');
						dbCon
							.update(dbTable, reqBody, filter)
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
