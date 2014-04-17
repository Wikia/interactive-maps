'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	sqlErrorHandler = require('./../../lib/sqlErrorHandler'),

	dbTable = 'poi_category',
	createSchema = {
		description: 'Schema for creating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string',
				required: true
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			},
			parent_poi_category_id: {
				description: 'Unique identifier for parent category',
				type: 'integer'
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
		description: 'Schema for updating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string'
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})'
			}
		},
		additionalProperties: false
	};

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @param url {string} - url path for CRUD
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD(url) {
	return {
		handler: {
			GET: function (req, res, next) {
				var dbColumns = ['id', 'name', 'marker'];
				dbCon
					.select(dbTable, dbColumns)
					.then(
					function (collection) {
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
									message: 'POI category successfully created',
									id: id,
									url: 'localhost:3000/api/v1/poi_category/' + id
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
				var dbColumns = ['name', 'marker', 'parent_poi_category_id', 'city_id', 'created_on', 'created_by'],
					id = parseInt(req.pathVar.id),
					filter = {
						id: id
					};

				if (isFinite(id)) {
					dbCon
						.select(dbTable, dbColumns, filter)
						.then(
						function (collection) {
							if (collection[0]) {
								res.send(200, collection[0]);
								res.end();
							} else {
								next({
									status: 404,
									message: {
										message: 'POI not found',
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
									message: 'POI category successfully updated',
									id: id,
									url: 'localhost:3000/api/v1/poi_category/' + id
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
