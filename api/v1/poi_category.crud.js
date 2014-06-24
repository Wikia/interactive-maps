'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	poiCategoryMarker = require('./../../lib/poiCategoryMarker'),

	urlPattern = jsonValidator.getUrlPattern(),

	dbTable = 'poi_category',
	createSchema = {
		description: 'Schema for creating a category',
		type: 'array',
		items: {
			type: 'object',
			properties: {
				name: {
					description: 'Name of a category',
					type: 'string',
					required: true,
					minLength: 1,
					maxLength: 255
				},
				map_id: {
					description: 'ID of the map this POI belongs to',
					type: 'integer',
					required: true
				},
				marker: {
					description: 'Url to custom marker icon',
					type: 'string',
					pattern: urlPattern,
					maxLength: 255
				},
				parent_poi_category_id: {
					description: 'Unique identifier for parent category',
					type: 'integer',
					required: 'true'
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
		minLength: 1
	},
	updateSchema = {
		description: 'Schema for updating a category',
		type: 'object',
		properties: {
			name: {
				description: 'Name of a category',
				type: 'string',
				minLength: 1,
				maxLength: 255
			},
			marker: {
				description: 'Url to custom marker icon',
				type: 'string',
				pattern: urlPattern,
				maxLength: 255
			}
		},
		additionalProperties: false
	},
	multiUpdateSchema = {
		description: 'Schema for updating many categories at once',
		type: 'array',
		items: {
			description: 'Schema for updating a category',
			type: 'object',
			properties: {
				id: {
					description: 'Identifier of the category',
					type: 'integer',
					required: true
				},
				name: {
					description: 'Name of a category',
					type: 'string',
					minLength: 1,
					maxLength: 255
				},
				marker: {
					description: 'Url to custom marker icon',
					type: 'string',
					pattern: urlPattern,
					maxLength: 255
				}
			},
			additionalProperties: false
		},
		minLength: 1
	},
	multiDeleteSchema = {
		description: 'Schema for deleting many categories at once',
		type: 'array',
		items: {
			description: 'ID of the map to be deleted',
			type: 'integer'
		},
		minLength: 1
	};

/**
 * @desc Handle deleting used categories by moving all points to CatchAll category
 *
 * @param {number} id
 * @param {object} res
 * @param {function} next
 */
function handleUsedCategories(id, res, next) {
	dbCon.update(
		'poi', {
			poi_category_id: config.catchAllCategoryId
		}, {
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
 * @desc Deletes categories with given IDs from DB
 * @param {array} ids
 * @param {object} res
 * @param {function} next
 */
function deletePOICategories(ids, res, next) {
	dbCon
		.knex
		.transaction(function (trx) {
			var filter,
				results;
			ids.forEach(function (id) {
				if (isFinite(id)) {
					filter = {
						id: id
					};
					dbCon
						.destroy(dbTable, filter)
						.transacting(trx)
						.then(
							function (affectedRows) {
								if (affectedRows > 0) {
									if (ids[ids.length - 1] === id) {
										trx.commit();
									}
								} else {
									trx.rollback();
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
									trx.rollback();
									next(err);
								}
							}
					);
				} else {
					next(errorHandler.badNumberError(id));
				}
			});
		})
		.then(function () {
			res.send(204, {});
			res.end();
		})
		.catch (function (err) {
			next(err);
		});
}

/**
 * @desc Updates categories with given ID's in DB
 * @param {object} req
 * @param {object} res
 * @param {function} next
 * @param {object} reqBody Raw ayload of the request
 */
function updatePOICategories(req, res, next, reqBody) {
	// If new marker is uploaded, reset the marker status to 0
	dbCon
		.knex
		.transaction(function (trx) {
			var id,
				filter,
				results = [];
			//unify the wildcard case
			id = parseInt(req.pathVar.id, 10);
			if (id) {
				reqBody.id = id;
				reqBody = [reqBody];
			}
			reqBody.forEach(function (each) {
				var eachId = each.id;
				if (each.marker) {
					each.status = 0;
				}
				if (isFinite(eachId)) {
					filter = {
						id: eachId
					};
					dbCon
						.update(dbTable, each, filter)
						.transacting(trx)
						.then(
							function (affectedRows) {
								if (affectedRows > 0) {
									results.push({
										id: eachId,
										url: utils.responseUrl(req, '/api/v1/poi_category', eachId)
									});
									if (each.marker) {
										poiCategoryMarker(id, each.map_id, each.marker, dbTable);
									}
									if (each === reqBody[reqBody.length - 1]) {
										trx.commit(results);
									}
								} else {
									trx.rollback();
									next(errorHandler.elementNotFoundError(dbTable, eachId));
								}
							},
							next
					);
				} else {
					next(errorHandler.badNumberError(eachId));
				}
			});
		})
		.then(function (results) {
			res.send(303, {
				message: 'POI categories successfully updated',
				categories: results
			});
			res.end();
		})
		.catch (function (err) {
			next(err);
		});
}

/**
 * @desc Creates CRUD collection based on configuration object passed as parameter
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: function (req, res, next) {
				var dbColumns = ['id', 'name', 'marker', 'map_id'];
				dbCon
					.select(dbTable, dbColumns)
					.then(
						function (collection) {
							utils.convertMarkersNamesToUrls(
								collection,
								config.dfsHost,
								config.bucketPrefix,
								config.markersPrefix
							);
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
					dbCon
						.knex
						.transaction(function (trx) {
							var results = [];
							reqBody.forEach(function (each) {
								dbCon.insert(dbTable, each)
									.transacting(trx)
									.then(function (data) {
										results.push({
											id: data[0]
										});
										if (each === reqBody[reqBody.length - 1]) {
											trx.commit(results);
										}
									});
							});
						})
						.then(function (result) {
							results.forEach(function (result) {
								result.url = utils.responseUrl(req, req.route.path, result.id);
							});
							res.send(201, {
								message: 'POI categories successfully created',
								categories: results
							});
							res.end();
						})
						.catch (function (err) {
							next(err);
						});
				} else {
					next(errorHandler.badRequestError(errors));
				}
			},
			PUT: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, multiUpdateSchema);

				if (errors.length === 0) {
					updatePOICategories(req, res, next, reqBody);
				} else {
					next(errorHandler.badRequestError(errors));
				}
			},
			DELETE: function (req, res, next) {
				var reqBody = reqBodyParser(req.rawBody),
					errors = jsonValidator.validateJSON(reqBody, multiDeleteSchema);

				if (errors.length === 0) {
					deletePOICategories(reqBody, res, next);
				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		},
		wildcard: {
			DELETE: function (req, res, next) {
				var id = parseInt(req.pathVar.id, 10);
				deletePOICategories([id], res, next);
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
								utils.convertMarkersNamesToUrls(
									collection,
									config.dfsHost,
									config.bucketPrefix,
									config.markersPrefix
								);
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
					errors = jsonValidator.validateJSON(reqBody, updateSchema);

				if (errors.length === 0) {
					updatePOICategories(req, res, next, reqBody);
				} else {
					next(errorHandler.badRequestError(errors));
				}
			}
		}
	};
};
