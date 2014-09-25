'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	poiCategoryMarker = require('./../../lib/poiCategoryMarker'),
	squidUpdate = require('./../../lib/squidUpdate'),
	poiCategoryConfig = require('./poi_category.config'),
	poiCategoryUtils = require('./poi_category.utils'),
	crudUtils = require('./crud.utils');

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
		})
		.then(function (collection) {
			utils.sendHttpResponse(res, 200, poiCategoryUtils.processPoiCategoriesCollection(collection));
		})
		.fail(next);
}

/**
 * @desc CRUD function for getting collection of poi categories
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function getPoiCategory(req, res, next) {
	var id = req.pathVar.id,
		filter,
		query;

	crudUtils.validateIdParam(id);
	id = parseInt(req.pathVar.id, 10);
	filter = {
		id: id
	};
	query = dbCon.knex(poiCategoryConfig.dbTable).column(poiCategoryConfig.getCollectionDbColumns).where(filter);

	dbCon.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return query.connection(conn).select();
		})
		.then(function (collection) {
			poiCategoryUtils.processPoiCategory(id, collection, res, next);
		})
		.fail(next);
}

/**
 * @desc CRUD function for creating poi category
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function createPoiCategory(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		mapId = reqBody.map_id,
		poiCategoryId,
		dbConnection;

	crudUtils.validateData(reqBody, poiCategoryConfig.createSchema);

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
		// add new row to DB table and save reference to promise result
			dbConnection = conn;
			return dbCon.insert(dbConnection, poiCategoryConfig.dbTable, reqBody);
		})
		.then(function (data) {
			poiCategoryId = data[0];

			// handle custom markers
			if (reqBody.marker) {
				poiCategoryMarker(poiCategoryId, mapId, reqBody.marker, poiCategoryConfig.dbTable);
			}

			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		})
		.then(function () {
			// purge cache for map
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryCreated');

			// send proper response
			utils.sendHttpResponse(res, 201, poiCategoryUtils.setupCreatePoiCategoryResponse(poiCategoryId, req));
		})
		.fail(next);
}

/**
 * @desc CRUD function for deleting poi category
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {function} next
 */
function deletePoiCategory(req, res, next) {
	var poiCategoryId = req.pathVar.id,
		filter,
		mapId,
		dbConnection;

	crudUtils.validateIdParam(poiCategoryId);
	poiCategoryId = parseInt(poiCategoryId, 10);
	filter = {
		id: poiCategoryId
	};

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return poiCategoryUtils.getMapId(dbConnection, poiCategoryId);
		})
		.then(function (id) {
			mapId = id;
			return dbCon.destroy(dbConnection, poiCategoryConfig.dbTable, filter);
		})
		.then(function (affectedRows) {
			if (affectedRows <= 0) {
				throw errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, poiCategoryId);
			}

			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		})
		.then(function () {
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryDeleted');
			utils.sendHttpResponse(res, 204, {});
		})
		.fail(function (err) {
			if (poiCategoryUtils.isDeletedCategoryUsed(err)) {
				poiCategoryUtils.handleUsedCategories(dbConnection, poiCategoryId, res, next);
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
		poiCategoryId = parseInt(req.pathVar.id, 10),
		response = {
			message: 'POI category successfully updated'
		},
		filter = {
			id: poiCategoryId
		},
		dbConnection,
		mapId;

	crudUtils.validateData(reqBody, poiCategoryConfig.updateSchema);
	crudUtils.validateIdParam(poiCategoryId);

	// If new marker is uploaded, reset the marker status to 0
	if (reqBody.marker) {
		reqBody.status = 0;
	}

	dbCon.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return poiCategoryUtils.getMapId(dbConnection, poiCategoryId);
		})
		.then(function (id) {
			mapId = id;
			return dbCon.update(dbConnection, poiCategoryConfig.dbTable, reqBody, filter);
		})
		.then(function (affectedRows) {
			if (affectedRows <= 0) {
				throw errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, poiCategoryId);
			}

			utils.extendObject(response, {
				id: poiCategoryId,
				url: utils.responseUrl(req, '/api/v1/poi_category/', poiCategoryId)
			});

			if (reqBody.marker) {
				poiCategoryMarker(poiCategoryId, mapId, reqBody.marker, poiCategoryConfig.dbTable);
			}

			return utils.changeMapUpdatedOn(dbConnection, dbCon, mapId);
		})
		.then(function () {
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + mapId, 'poiCategoryUpdated');
			utils.sendHttpResponse(res, 303, response);
		})
		.fail(next);
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
