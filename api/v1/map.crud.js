'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	sqlErrorHandler = require('./../../lib/sqlErrorHandler'),

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
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @param url {string} - url path for CRUD
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				dbCon.knex(dbTable)
					.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
					.column([
						'map.id',
						'map.title',
						'tile_set.name',
						'tile_set.org_img'
					])
					.where({city_id: 1})
					.select()
					.then(
						function (collection) {
							collection.forEach(function(value) {
								value.image = 'http://dev-dfs-p1/' + 'intmap_' + value.name.replace(/\s/g, '_') + '/' + value.org_img;
								value.url = req.protocol + '://' + req.headers.host + req.route.path + '/' + value.id;

								delete value.name;
								delete value.org_img;
							});

							res.send(200, collection);
							res.end();
						},
						function (err) {
							next(sqlErrorHandler(err, req));
						}
					);
			},
			POST: function (req, res, next) {
				var	reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, createSchema);

				if (errors.length === 0) {
					dbCon
						.insert(dbTable, reqBody)
						.then(
							function (data) {
								var id = data[0],
									response = {
									message: 'Map successfully created',
									id: id,
									url: req.protocol + '://' + req.headers.host + req.url + '/' + id
								};

								res.send(201, response);
								res.end();
							},
							function (err) {
								next(sqlErrorHandler(err, req));
							}
						);
				} else {
					next({
						status: 400,
						message: {
							message: 'Bad request',
							details: errors
						}
					});
				}
			}
		},
		wildcard: {
			DELETE: function (req, res, next) {
				var id = parseInt(req.pathVar.id ),
					filter = {
						id: id
					};
				if (isFinite(id)) {
					dbCon
						.destroy(dbTable, filter)
						.then(
						function () {
							res.send(204, {});
							res.end();
						},
						function (err) {
							next(sqlErrorHandler(err, req));
						}
					);
				} else {
					next({
						status: 400,
						message: {
							message: 'Bad request',
							details: 'id: ' + req.pathVar.id + ' should be a number'
						}
					});
				}
			},
			GET: function (req, res, next) {
				var dbColumns = ['title', 'tile_set_id', 'city_id', 'created_by', 'created_on'],
					id = parseInt(req.pathVar.id),
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
									obj.tile_set_url = req.protocol + '://' + req.headers.host + '/api/v1/tile_set/' + obj.tile_set_id;
									res.send(200, obj);
									res.end();
								} else {
									next({
										status: 404,
										message: {
											message: 'Map not found',
											id: id
										}
									});
								}
							},
							function (err) {
								next(sqlErrorHandler(err, req));
							}
						);
				} else {
					next({
						status: 400,
						message: {
							message: 'Bad request',
							details: 'id: ' + req.pathVar.id + ' should be a number'
						}
					});
				}
			},
			PUT: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, updateSchema);

				if (errors.length === 0) {
					var id = parseInt(req.pathVar.id),
						filter = {
							id: id
						};

					if (isFinite(id)) {
						dbCon
							.update(dbTable, reqBody, filter)
							.then(
							function () {
								var response = {
									message: 'Map successfully updated',
									id: id,
									url: req.protocol + '://' + req.headers.host + req.url
								};

								res.send(303, response);
								res.end();
							},
							function (err) {
								next(sqlErrorHandler(err, req));
							}
						);
					} else {
						next({
							status: 400,
							message: {
								message: 'Bad request',
								details: 'id: ' + req.pathVar.id + ' should be a number'
							}
						});
					}

				} else {
					next({
						status: 400,
						message: errors
					});
				}
			}
		}
	};
};
