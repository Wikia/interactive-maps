'use strict';

var dbCon = require('./../../lib/db_connector'),
	utils = require('./../../lib/utils'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),

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
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				var cityId = parseInt(req.query.city_id, 10) || 0,
					filter = {};

				if (cityId !== 0) {
					filter.city_id = cityId;
				}

				dbCon.knex(dbTable)
					.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
					.column([
						'map.id',
						'map.title',
						'tile_set.name',
						'tile_set.image'
					])
					.where(filter)
					.select()
					.then(
						function (collection) {
							collection.forEach(function (value) {
								// TODO: add path to dfs to config
								value.image = 'http://dev-dfs-p1/' + utils.getBucketName(value.name) + '/' + value.image;
								value.url = req.protocol + '://' + req.headers.host + req.route.path + '/' + value.id;

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
					dbCon
						.insert(dbTable, reqBody)
						.then(
							function (data) {
								var id = data[0],
									response = {
										message: 'Map successfully created',
										id: id,
										url: req.protocol + '://' + req.headers.host + req.route.path + '/' + id
									};

								res.send(201, response);
								res.end();
							},
							next
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
				var id = parseInt(req.pathVar.id, 10),
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
							next
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
									// TODO: refactor path building
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
							next
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

				console.log(req);
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, updateSchema);

				if (errors.length === 0) {
					var id = parseInt(req.pathVar.id, 10),
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
										// TODO: refactor path building
										url: req.protocol + '://' + req.headers.host + '/api/v1/map/' + id
									};

									res.send(303, response);
									res.end();
								},
								next
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
