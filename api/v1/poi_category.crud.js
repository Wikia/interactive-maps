'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	poiCategoryMarker = require('./../../lib/poiCategoryMarker'),

	urlPattern = '^(http[s]?:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+' +
		'((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?',

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
			map_id: {
				description: 'ID of the map this POI belongs to',
				type: 'integer',
				required: true
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: urlPattern
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
				pattern: urlPattern
			}
		},
		additionalProperties: false
	};


/**
 * @desc Handle deleting used categories by moving all points to CatchAll category
 *
 * @param id {number}
 * @param res {object}
 * @param next {function}
 */
function handleUsedCategories(id, res, next) {
	dbCon.update(
		'poi',
		{
			poi_category_id: config.catchAllCategoryId
		},
		{
			poi_category_id: id
		}
	).then(
		function (rowsAffected) {
			if (rowsAffected > 0) {
				dbCon.destroy(dbTable, {
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
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
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
										message: 'POI category successfully created',
										id: id,
										url: utils.responseUrl(req, req.route.path, id)
									};
								if (reqBody.marker) {
									poiCategoryMarker(id, reqBody.map_id, reqBody.marker, dbTable);
								}
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
				var id = parseInt(req.pathVar.id),
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
							function (err) {
								// If the delete request results an error, check if the error is reference error
								// (caused by non able to delete foreign key) and handle this case by calling
								// the handleUsedCategories function, otherwise handle the error as regular error
								if (
									err.hasOwnProperty('clientError') &&
									err.clientError.name === 'RejectionError' &&
									err.clientError.cause.code === 'ER_ROW_IS_REFERENCED_'
								) {
									handleUsedCategories(id, res, next);
								} else {
									next(err);
								}
							}
					);
				} else {
					next(errorHandler.badNumberError(req.pathVar.id));
				}
			},
			GET: function (req, res, next) {
				var dbColumns = [
						'name',
						'marker',
						'parent_poi_category_id',
						'map_id',
						'category_type',
						'created_on',
						'created_by'
					],
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
					var id = parseInt(req.pathVar.id),
						filter = {
							id: id
						};
					// If new marker is uploaded, reset the marker status to 0
					if (reqBody.marker) {
						reqBody.status = 0;
					}
					if (isFinite(id)) {
						dbCon
							.update(dbTable, reqBody, filter)
							.then(
								function (affectedRows) {
									if (affectedRows > 0) {
										var response = {
											message: 'POI category successfully updated',
											id: id,
											url: utils.responseUrl(req, '/api/v1/poi_category', id)
										};
										if (reqBody.marker) {
											poiCategoryMarker(id, reqBody.map_id, reqBody.marker, dbTable);
										}
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
