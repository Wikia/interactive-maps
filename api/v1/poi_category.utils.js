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
 * @desc Throws an error if there were no POIs within category of given id
 * @param {Number} affectedRows number of POIs within a category
 * @param {Number} id POI category's id
 */
function throwErrorIfNoRowsAffected(affectedRows, id) {
	if (affectedRows <= 0) {
		throw errorHandler.elementNotFoundError(poiCategoryConfig.dbTable, id);
	}
}

/**
 * @desc Returns simple response object
 * @returns {Object} response object for deleted POI category
 */
function getDeletedResponse() {
	return {
		message: poiCategoryConfig.responseMessages.deleted
	};
}

/**
 * @desc Handle deleting used categories by moving all points to CatchAll category
 *
 * @param {object} conn database connection
 * @param {number} id POI category's id
 * @param {object} res express.js response object
 * @param {function} next express.js callback function
 */
function handleUsedCategories(conn, id, res, next) {
	updatePoisFromUsedCategory(conn, id)
		.then(function (affectedRows) {
			throwErrorIfNoRowsAffected(affectedRows, id);
			return deleteCategory(conn, id);
		})
		.then(function (affectedRows) {
			throwErrorIfNoRowsAffected(affectedRows, id);
			utils.sendHttpResponse(res, 200, getDeletedResponse());
		})
		.fail(next);
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
		columns = ['map_id'],
		where = {id: poiCategoryId};

	dbCon
		.select(conn, poiCategoryConfig.dbTable, columns, where)
		.then(function (collection) {
			if (collection[0] && collection[0].map_id) {
				deferred.resolve(parseInt(collection[0].map_id, 10));
			} else {
				deferred.reject();
			}
		});

	return deferred.promise;
}

/**
 * @desc Returns a response object for creation of POI category
 * @param {Number} id POI category id
 * @param {Object} req request object from express.js
 * @returns {{message: string, id: *, url: (Number|String)}}
 */
function setupCreatePoiCategoryResponse(id, req) {
	return {
		message: poiCategoryConfig.responseMessages.created,
		id: id,
		url: utils.responseUrl(req, utils.addTrailingSlash(req.route.path), id)
	};
}

/**
 * @desc Checks if the error is DB error connected to foreign key constraint
 *
 * If the delete request results an error, check if the error is reference error
 * (caused by non able to delete foreign key) and handle this case by calling
 * the handleUsedCategories function, otherwise handle the error as regular
 * error. See: poi_category.crud.js:156
 *
 * @param {Object} err an error instance
 * @returns {*|clientError|testCases.clientError|Error.clientError|testCases.clientError.name|boolean}
 */
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
	isDeletedCategoryUsed: isDeletedCategoryUsed,
	getDeletedResponse: getDeletedResponse
};
