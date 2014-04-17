'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	sqlErrorHandler = require('./../../lib/sqlErrorHandler'),

	// custom action for POST method
	addTileSet = require('./../../lib/addTileSet'),

	dbTable = 'tile_set',
	createSchema = {
		description: 'Schema for creating tile set',
		type: 'Object',
		properties: {
			name: {
				description: 'Tile set name',
				type: 'string',
				required: true
			},
			url: {
				description: 'URL to image from which tiles wil be created',
				type: 'string',
				pattern: '(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})',
				required: true
			},
			created_by: {
				description: 'Creator user name',
				type: 'string',
				required: true
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
				var dbColumns = ['id', 'name', 'type'];

				dbCon
					.select(dbTable, dbColumns)
					.then(
					function (collection) {
						collection.forEach(function(value) {
							value.url = req.protocol + '://' + req.headers.host + req.route.path + '/' + value.id;
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
					addTileSet(dbTable, reqBody)
						.then(
							function (data) {
								var id = data[0],
									response = {
										message: 'Tile set added to processing queue',
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
			GET: function (req, res, next) {
				var dbColumns = ['name', 'type', 'org_img', 'width', 'height', 'min_zoom', 'max_zoom', 'created_by', 'created_on'],
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
								obj.org_img = 'http://dev-dfs-p1/' + 'intmap_' + obj.name.replace(/\s/g, '_') + '/' + obj.org_img;

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
			}
		}
	};
};
