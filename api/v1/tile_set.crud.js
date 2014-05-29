'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	config = require('./../../lib/config'),

	// custom action for POST method
	addTileSet = require('./../../lib/addTileSet'),

	urlPattern = jsonValidator.getUrlPattern(),

	dbTable = 'tile_set',
	createSchema = {
		description: 'Schema for creating tile set',
		type: 'Object',
		properties: {
			name: {
				description: 'Tile set name',
				type: 'string',
				required: true,
				minLength: 1
			},
			url: {
				description: 'URL to image from which tiles wil be created',
				type: 'string',
				pattern: urlPattern,
				required: true
			},
			created_by: {
				description: 'Creator user name',
				type: 'string',
				required: true,
				minLength: 1
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
				var dbColumns = ['id', 'name', 'type', 'status'];

				dbCon
					.select(
						dbTable,
						dbColumns, {
							status: utils.tileSetStatus.ok
						}
				)
					.then(
						function (collection) {
							collection.forEach(function (value) {
								value.url = utils.responseUrl(req, req.route.path, value.id);
							});

							res.send(200, collection);
							res.end();
						},
						next
				);
			},
			POST: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, createSchema);

				if (errors.length === 0) {
					addTileSet(dbTable, reqBody)
						.then(
							function (data) {
								var id = data.id,
									responseCode = 201,
									response = {
										message: 'Tile set added to processing queue',
										id: id,
										url: utils.responseUrl(req, req.route.path, id)
									};
								if (data.exists) {
									response.message = 'This tile set already exists';
									responseCode = 200;
								}
								res.send(responseCode, response);
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
			GET: function (req, res, next) {
				var dbColumns = [
						'name',
						'type',
						'image',
						'width',
						'height',
						'min_zoom',
						'max_zoom',
						'status',
						'created_by',
						'created_on',
						'attribution',
						'subdomains'
					],
					id = parseInt(req.pathVar.id),
					filter = {
						id: id,
						status: utils.tileSetStatus.ok
					};

				if (isFinite(id)) {
					dbCon
						.select(dbTable, dbColumns, filter)
						.then(
							function (collection) {
								var obj = collection[0];

								if (obj) {
									// TODO: fix hardcoded DFS host
									obj.image = utils.imageUrl(
										config.dfsHost,
										utils.getBucketName(config.bucketPrefix, obj.name),
										obj.image
									);
									obj.max_zoom = utils.binToMaxZoomLevel(obj.max_zoom);
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
			}
		}
	};
};
