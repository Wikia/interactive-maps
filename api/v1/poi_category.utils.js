'use strict';

var dbCon = require('./../../lib/db_connector'),
	errorHandler = require('./../../lib/errorHandler'),
	utils = require('./../../lib/utils'),
	Q = require('q'),
	config = require('./../../lib/config'),
	poiCategoryConfig = require('./poi_category.config'),
	poiConfig = require('./poi.config');

/**
 * @desc Moves all POIs linked with poi_category of given id to default category
 *
 * @param {object} conn
 * @param {integer} id POI category id to which POIs belong
 * @returns {object}
 */
function updatePoisFromUsedCategory(conn, id) {
	return dbCon.update(
		conn,
		poiConfig.dbTable,
		{
			poi_category_id: config.catchAllCategoryId
		},
		{
			poi_category_id: id
		}
	);
}

/**
 * @desc Removes a poi_category of given id row from DB
 *
 * @param {object} conn
 * @param {integer} id category which should be removed id
 * @returns {object}
 */
function deleteCategory(conn, id) {
	return dbCon.destroy(
		conn,
		poiCategoryConfig.dbTable,
		{
			id: id
		}
	);
}

/**
 * @desc Handle deleting used categories by moving all points to CatchAll category
 *
 * @param {object} conn
 * @param {number} id
 * @param {object} res
 * @param {function} next
 */
function handleUsedCategories(conn, id, res, next) {
	updatePoisFromUsedCategory(conn, id).then(function (rowsAffected) {
		if (rowsAffected > 0) {
			deleteCategory(conn, id).then(function (affectedRows) {
				if (affectedRows > 0) {
					utils.sendHttpResponse(res, 204, {});
				} else {
					next(errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, id));
				}
			}, next);
		} else {
			next(errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, id));
		}
	}, next);
}

/**
 * @desc Gets map id for a POI category
 *
 * @param {Object} conn - Database connection
 * @param {Number} poiCategoryId
 * @returns {Object} - promise
 */
function getMapId(conn, poiCategoryId) {
	var deferred = Q.defer(),
		query = dbCon.knex(poiCategoryConfig.dbTable)
			.column(['map_id'])
			.connection(conn)
			.where({
				id: poiCategoryId
			});

	query.select().then(
		function (collection) {
			if (collection[0]) {
				deferred.resolve(parseInt(collection[0].map_id, 10));
			} else {
				deferred.reject();
			}
		}
	);

	return deferred.promise;
}

function setupCreatePoiCategoryResponse(id, req) {
	return {
		message: 'POI category successfully created',
		id: id,
		url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
	};
}

// If the delete request results an error, check if the error is reference error
// (caused by non able to delete foreign key) and handle this case by calling
// the handleUsedCategories function, otherwise handle the error as regular
// error

function isDeletedCategoryUsed(err) {
	return (
		err &&
		err.clientError &&
		err.clientError.name &&
		errorHandler.isHandledSQLError(err.clientError.name) &&
		err.clientError.cause.code === 'ER_ROW_IS_REFERENCED_'
	);
}

module.exports = {
	handleUsedCategories: handleUsedCategories,
	getMapId: getMapId,
	setupCreatePoiCategoryResponse: setupCreatePoiCategoryResponse,
	isDeletedCategoryUsed: isDeletedCategoryUsed
};
