'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	poiCategoryMarker = require('./../../lib/poiCategoryMarker'),
	squidUpdate = require('./../../lib/squidUpdate'),
	poiCategoryConfig = require('./poi_category.config'),
	poiCategoryUtils = require('./poi_category.utils'),
	crudUtils = require('./crud.utils.js');

/**
 * @desc CRUD function for getting collection of poi categories
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function getPoiCategoriesCollection(req, res, next) {
	var query = dbCon.knex(poiCategoryConfig.dbTable).column(poiCategoryConfig.getCollectionDbColumns);

	// limit query to parent categories only
	if (req.query.hasOwnProperty('parentsOnly')) {
		query.where({
			parent_poi_category_id: null
		});
	}

	dbCon
		.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return query
				.connection(conn)
				.select();
		}, crudUtils.passError)
		.then(function (collection) {
			utils.sendHttpResponse(res, 200, poiCategoryUtils.processPoiCategoriesCollection(collection));
		}, next);
}

/**
 * @desc CRUD function for getting collection of poi categories
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function getPoiCategory(req, res, next) {
	var id = parseInt(req.pathVar.id, 10),
		filter = {
			id: id
		},
		query = dbCon.knex(poiCategoryConfig.dbTable).column(poiCategoryConfig.getCollectionDbColumns).where(filter);

	if (!isFinite(id)) {
		next(errorHandler.badNumberError(req.pathVar.id));
	}

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return query.connection(conn).select();
		}, crudUtils.passError)
		.then(function (collection) {
			poiCategoryUtils.processPoiCategory(id, collection, res, next);
		}, next);
}

/**
 * @desc CRUD function for creating poi category
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function createPoiCategory(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		errors = jsonValidator.validateJSON(reqBody, poiCategoryConfig.createSchema),
		mapId = reqBody.map_id,
		poiCategoryId,
		dbConnection;

	if (errors.length > 0) {
		next(errorHandler.badRequestError(errors));
	}

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
		// add new row to DB table and save reference to promise result
			dbConnection = conn;
			return dbCon.insert(dbConnection, poiCategoryConfig.dbTable, reqBody);
		}, crudUtils.passError)
		.then(function (data) {
			poiCategoryId = data[0];

			// handle custom markers
			if (reqBody.marker) {
				poiCategoryMarker(poiCategoryId, mapId, reqBody.marker, poiCategoryConfig.dbTable);
			}

			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		}, crudUtils.passError)
		.then(function () {
			// purge cache for map
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryCreated');

			// send proper response
			utils.sendHttpResponse(res, 201, poiCategoryUtils.setupCreatePoiCategoryResponse(poiCategoryId, req));
		}, next);
}

/**
 * @desc CRUD function for deleting poi category
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function deletePoiCategory(req, res, next) {
	var poiId = parseInt(req.pathVar.id, 10),
		filter = {
			id: poiId
		},
		mapId,
		dbConnection;

	if (!isFinite(poiId)) {
		next(errorHandler.badNumberError(req.pathVar.id));
	}

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return poiCategoryUtils.getMapId(dbConnection, poiId);
		}, crudUtils.passError)
		.then(function (id) {
			mapId = id;
			return dbCon.destroy(dbConnection, poiCategoryConfig.dbTable, filter);
		}, crudUtils.passError)
		.then(function (affectedRows) {
			if (affectedRows > 0) {
				utils.changeMapUpdatedOn(dbConnection, dbCon, mapId).then(function () {
					// purge cache for map
					squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryDeleted');
					utils.sendHttpResponse(res, 204, {});
				}, next);
			} else {
				next(errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, poiId));
			}
		}, function (err) {
			if (poiCategoryUtils.isDeletedCategoryUsed(err)) {
				poiCategoryUtils.handleUsedCategories(dbConnection, poiId, res, next);
			} else {
				next(err);
			}
		});
}

/**
 * @desc CRUD function for updating poi category
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function updatePoiCategory (req, res, next) {
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
			PUT: updatePoiCategory
		}
	};
};
