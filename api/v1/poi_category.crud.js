'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	config = require('./../../lib/config'),
	poiCategoryMarker = require('./../../lib/poiCategoryMarker'),
	squidUpdate = require('./../../lib/squidUpdate'),
	poiCategoryConfig = require('./poi_category.config'),
	poiCategoryUtils = require('./poi_category.utils');

/**
 * @desc CRUD function for getting collection of poi categories
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function getPoiCategoriesCollection(req, res, next) {
	dbCon.getConnection(dbCon.connType.all, function (conn) {
		var query = dbCon.knex(poiCategoryConfig.dbTable).column(poiCategoryConfig.getCollectionDbColumns);

		// limit query to parent categories only
		if (req.query.hasOwnProperty('parentsOnly')) {
			query.where({
				parent_poi_category_id: null
			});
		}

		query
			.connection(conn)
			.select()
			.then(function (collection) {
				utils.sendHttpResponse(res, 200, poiCategoryUtils.processPoiCategoriesCollection(collection));
			},
			next
		);
	}, next);
}

/**
 * @desc CRUD function for getting collection of poi categories
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function getPoiCategory(req, res, next) {
	var id = parseInt(req.pathVar.id, 10),
		filter = {
			id: id
		};

	if (isFinite(id)) {
		dbCon.getConnection(dbCon.connType.all, function (conn) {
			dbCon.select(
				conn,
				poiCategoryConfig.dbTable,
				poiCategoryConfig.getCategoryDBColumns,
				filter
			).then(function (collection) {
				utils.handleDefaultMarker(collection);
				utils.convertMarkersNamesToUrls(
					collection,
					config.dfsHost,
					config.bucketPrefix,
					config.markersPrefix
				);

				if (collection[0]) {
					utils.sendHttpResponse(res, 200, collection[0]);
				} else {
					next(errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, id));
				}
			}, next);
		}, next);
	} else {
		next(errorHandler.badNumberError(req.pathVar.id));
	}
}

/**
 * @desc CRUD function for creating poi category
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function createPoiCategory(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		errors = jsonValidator.validateJSON(reqBody, poiCategoryConfig.createSchema);

	if (errors.length === 0) {
		dbCon.getConnection(dbCon.connType.master, function (conn) {
			dbCon
				.insert(conn, poiCategoryConfig.dbTable, reqBody)
				.then(function (data) {
					var id = data[0],
						mapId = reqBody.map_id;

					// handle custom markers
					if (reqBody.marker) {
						poiCategoryMarker(id, mapId, reqBody.marker, poiCategoryConfig.dbTable);
					}

					utils.changeMapUpdatedOn(conn, dbCon, mapId).then(function () {
						// purge cache for map
						squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryCreated');

						utils.sendHttpResponse(res, 201, poiCategoryUtils.setupCreatePoiCategoryResponse(id, req));
					}, next);
				}, next);
		}, next);
	} else {
		next(errorHandler.badRequestError(errors));
	}
}

/**
 * @desc CRUD function for deleting poi category
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */

function deletePoiCategory(req, res, next) {
	var id = parseInt(req.pathVar.id, 10),
		filter = {
			id: id
		};

	if (isFinite(id)) {
		dbCon.getConnection(dbCon.connType.master, function (conn) {
			poiCategoryUtils.getMapId(conn, id).then(function (mapId) {
				dbCon
					.destroy(conn, poiCategoryConfig.dbTable, filter)
					.then(function (affectedRows) {
						if (affectedRows > 0) {
							utils.changeMapUpdatedOn(conn, dbCon, mapId).then(function () {
								// purge cache for map
								squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryDeleted');

								utils.sendHttpResponse(res, 204, {});
							}, next);
						} else {
							next(errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, id));
						}
					}, function (err) {
						if (poiCategoryUtils.isDeletedCategoryUsed(err)) {
							poiCategoryUtils.handleUsedCategories(conn, id, res, next);
						} else {
							next(err);
						}
					});
			}, next);
		}, next);
	} else {
		next(errorHandler.badNumberError(req.pathVar.id));
	}
}

/**
 * @desc CRUD function for updating poi category
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */

function updatePoicategory (req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		id = parseInt(req.pathVar.id, 10),
		filter = {
			id: id
		},
		errors = jsonValidator.validateJSON(reqBody, poiCategoryConfig.updateSchema);

	if (errors.length === 0) {
		// If new marker is uploaded, reset the marker status to 0
		if (reqBody.marker) {
			reqBody.status = 0;
		}

		if (isFinite(id)) {
			dbCon.getConnection(dbCon.connType.master, function (conn) {
				poiCategoryUtils.getMapId(conn, id).then(function (mapId) {
					dbCon
						.update(conn, poiCategoryConfig.dbTable, reqBody, filter)
						.then(function (affectedRows) {
							if (affectedRows > 0) {
								var response = {
									message: 'POI category successfully updated',
									id: id,
									url: utils.responseUrl(req, '/api/v1/poi_category/', id)
								};

								if (reqBody.marker) {
									poiCategoryMarker(id, mapId, reqBody.marker, poiCategoryConfig.dbTable);
								}

								utils.changeMapUpdatedOn(conn, dbCon, mapId).then(function () {
									squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryUpdated');

									utils.sendHttpResponse(res, 303, response);
								}, next);
							} else {
								next(errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, id));
							}
					}, next);
				}, next);
			}, next);
		} else {
			next(errorHandler.badNumberError(req.pathVar.id));
		}
	} else {
		next(errorHandler.badRequestError(errors));
	}
}

/**
 * @desc Creates CRUD collection
 * @returns {object} - CRUD collection
 */

module.exports = function createCRUD() {
	return {
		handler: {
			GET: getPoiCategoriesCollection,
			POST: createPoiCategory
		},
		wildcard: {
			DELETE: deletePoiCategory,
			GET: getPoiCategory,
			PUT: updatePoicategory
		}
	};
};
