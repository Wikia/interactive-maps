'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	jsonValidator = require('./../../lib/jsonValidator'),
	utils = require('./../../lib/utils'),
	errorHandler = require('./../../lib/errorHandler'),
	tileSetConfig = require('./tile_set.config'),
	tileSetUtils = require('./tile_set.utils'),
	addTileSet = require('./../../lib/addTileSet'); // custom action for POST method

/**
 * @desc CRUD function for getting collection of tileSets
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function getTileSetsCollection(req, res, next) {
	var filter = {
			status: utils.tileSetStatus.ok
		},
		limit = parseInt(req.query.limit, 10) || false,
		offset = parseInt(req.query.offset, 10) || 0,
		search = req.query.search || false,
		query = dbCon.knex(tileSetConfig.dbTable).column(tileSetConfig.getCollectionDbColumns).where(filter);

	// add search term to DB query
	if (search) {
		search = search.trim();

		if (!tileSetUtils.validateSearchTerm(search)) {
			next(
				errorHandler.badRequestError([tileSetConfig.searchErrorMsg])
			);
		}

		limit = tileSetUtils.setupSearchLimit(limit);
		tileSetUtils.addSearchToQuery(query, search);
	}

	// add pagination to DB query
	if (limit) {
		tileSetUtils.addPaginationToQuery(query, limit, offset);
	}

	dbCon
		.getConnection(dbCon.connType.all)
		.then(function (conn) {
			return query
				.connection(conn)
				.select();
		}, tileSetUtils.passError)
		.then(function (collection) {
			utils.sendHttoResponse(
				res,
				200,
				tileSetUtils.processTileSetCollection(collection, req, tileSetUtils.extendTileSetObject)
			);
		}, next);
}

/**
 * @desc CRUD function for getting tileSet
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function getTileSet(req, res, next) {
	var id = parseInt(req.pathVar.id),
		filter = {
			id: id,
			status: utils.tileSetStatus.ok
		};

	if (isFinite(id)) {
		dbCon
			.getConnection(dbCon.connType.all)
			.then(function (conn) {
				return dbCon.select(conn, tileSetConfig.dbTable, tileSetConfig.getTileSetDbColumns, filter);
			}, tileSetUtils.passError)
			.then(function (collection) {
				if (collection.length) {
					utils.sendHttoResponse(res, 200, tileSetUtils.extendTileSetObject(collection[0], req));
				} else {
					next(errorHandler.elementNotFoundError(tileSetConfig.dbTable, id));
				}
			}, next);
	} else {
		next(errorHandler.badNumberError(req.pathVar.id));
	}
}

/**
 * @desc CRUD function for creating new tileSets
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function createTileSet(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		errors = jsonValidator.validateJSON(reqBody, tileSetConfig.createSchema);

	if (errors.length === 0) {
		dbCon
			.getConnection(dbCon.connType.master)
			.then(function (conn) {
				return addTileSet(conn, tileSetConfig.dbTable, reqBody);
			}, tileSetUtils.passError)
			.then(function (data) {
				utils.sendHttoResponse(
					res,
					data.exists ? 200 : 201,
					tileSetUtils.setupCreateTileSetResponse(data, req)
				);
			}, next);
	} else {
		next(errorHandler.badRequestError(errors));
	}
}

/**
 * @desc Creates tileSet CRUD collection
 * @returns {object} - CRUD collection
 */
module.exports = function createCRUD() {
	return {
		handler: {
			GET: getTileSetsCollection,
			POST: createTileSet
		},
		wildcard: {
			GET: getTileSet
		}
	};
};
