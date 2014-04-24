'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),

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
					next
				);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator(reqBody, createSchema);

				if (errors.length === 0) {
					addTileSet(dbTable, reqBody)
						.then(
							function (data) {
								var id = data[0],
									response = {
										message: 'Tile set added to processing queue',
										id: id,
										url: req.protocol + '://' + req.headers.host + req.route.path + '/' + id
									};

								res.send(201, response);
								res.end();
							},
							next
						);
				} else {
					next(utils.badRequestError(errors));
				}
			}
		},
		wildcard: {
			GET: function (req, res, next) {
				var dbColumns = ['name', 'type', 'image', 'width', 'height', 'min_zoom', 'max_zoom', 'created_by', 'created_on'],
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
								obj.image = 'http://dev-dfs-p1/' + utils.getBucketName(obj.name) + '/' + obj.image;

								res.send(200, obj);
								res.end();
							} else {
								next(utils.elementNotFoundError(dbTable, id));
							}
						},
						next
					);
				} else {
					next(utils.badNumberError(req.pathVar.id));
				}
			}
		}
	};
};
