'use strict';

var dbCon = require('./../../lib/db_connector'),
	reqBodyParser = require('./../../lib/requestBodyParser'),
	utils = require('./../../lib/utils'),
	squidUpdate = require('./../../lib/squidUpdate'),
	errorHandler = require('./../../lib/errorHandler'),
	tileSetConfig = require('./tile_set.config'),
	tileSetUtils = require('./tile_set.utils'),
	crudUtils = require('./crud.utils.js'),
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
		sort = tileSetUtils.buildSort(req.query.sort),
		search = req.query.search || false,
		query = dbCon.knex(tileSetConfig.dbTable)
			.column(tileSetConfig.getCollectionDbColumns)
			.where(filter)
			.orderBy(sort.column, sort.direction),
		dbConnection;

	if (limit) {
		crudUtils.addPaginationToQuery(query, limit, offset);
	}

	dbCon
		.getConnection(dbCon.connType.all)
		.then(function (conn) {
			dbConnection = conn;
			return tileSetUtils.changeOptionsIfSearchIsValid(query, search, limit);
		})
		.then(function (data) {
			query = data.query;
			limit = data.limit;

			if (limit) {
				crudUtils.addPaginationToQuery(query, limit, offset);
			}

			return query
				.connection(dbConnection)
				.select();
		})
		.then(function (collection) {
			dbConnection.release();

			res.setCacheValidity(tileSetConfig.cacheValidity.forCollection);
			res.setSurrogateKey(utils.surrogateKeyPrefix + tileSetConfig.surrogateKeys.forCollection);
			utils.sendHttpResponse(
				res,
				200,
				tileSetUtils.processTileSetCollection(collection, req, tileSetUtils.extendTileSetObject)
			);
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc CRUD function for getting tileSet
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function getTileSet(req, res, next) {
	var id = req.pathVar.id,
		filter,
		dbConnection;

	crudUtils.validateIdParam(id);
	id = parseInt(req.pathVar.id);
	filter = {
		id: id,
		status: utils.tileSetStatus.ok
	};

	dbCon
		.getConnection(dbCon.connType.all)
		.then(function (conn) {
			dbConnection = conn;
			return dbCon.select(conn, tileSetConfig.dbTable, tileSetConfig.getTileSetDbColumns, filter);
		})
		.then(function (collection) {
			dbConnection.release();

			if (collection.length <= 0) {
				throw errorHandler.elementNotFoundError(tileSetConfig.dbTable, id);
			}

			res.setCacheValidity(tileSetConfig.cacheValidity.forWildcard);
			utils.sendHttpResponse(res, 200, tileSetUtils.extendTileSetObject(collection[0], req));
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
}

/**
 * @desc CRUD function for creating new tileSets
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next
 */
function createTileSet(req, res, next) {
	var reqBody = reqBodyParser(req.rawBody),
		dbConnection;

	crudUtils.validateData(reqBody, tileSetConfig.createSchema);

	dbCon
		.getConnection(dbCon.connType.master)
		.then(function (conn) {
			dbConnection = conn;
			return addTileSet(conn, tileSetConfig.dbTable, reqBody);
		})
		.then(function (data) {
			dbConnection.release();

			utils.sendHttpResponse(
				res,
				data.exists ? 200 : 202,
				tileSetUtils.setupCreateTileSetResponse(data, req)
			);

			squidUpdate.purgeKey(utils.surrogateKeyPrefix + tileSetConfig.surrogateKeys.forCollection,
				tileSetConfig.purgeCallers.created);
		})
		.fail(function () {
			crudUtils.releaseConnectionOnFail(dbConnection, next);
		});
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
