'use strict';

var errorHandler = require('./../../lib/errorHandler'),
	jsonValidator = require('./../../lib/jsonValidator');

/**
 * @desc adds pagination to DB query
 * @param {Object} query - Knex DB query object
 * @param {Number} limit - number of results
 * @param {Number} offset - offset from top
 */
function addPaginationToQuery(query, limit, offset) {
	query
		.limit(limit)
		.offset(offset);
}

/**
 * @desc Checks if a value passed as a unique id is valid
 * @param {String|Number} value a number passed as id value
 */
function validateIdParam(value) {
	if (!isFinite(value)) {
		throw errorHandler.badNumberError(value);
	}

	if (value <= 0) {
		throw errorHandler.badRequestError('Invalid id');
	}
}

/**
 * @desc Validates data passed for insert/update operation
 * @param {Object} reqBody data send with the request
 * @param {String} schema a schema against which it should be validated (taken from cruds' configs)
 */
function validateData(reqBody, schema) {
	var errors = [];

	if (schema) {
		errors = jsonValidator.validateJSON(reqBody, schema);
	}

	if (errors.length > 0) {
		throw errorHandler.badRequestError(errors);
	}
}

/**
 * @desc Throws an error if there were no POIs within category of given id
 * @param {Number} affectedRows number of POIs within a category
 * @param {Object} crudConfig configuration with database table
 * @param {Number} id POI category's id
 */
function throwErrorIfNoRowsAffected(affectedRows, crudConfig, id) {
	if (affectedRows <= 0) {
		throw errorHandler.elementNotFoundError(crudConfig.dbTable, id);
	}
}

/**
 * Helper function which releases database connection one a promise chain fails
 *
 * @param {Object} conn database connection handler
 * @param {Function} next express.js callback
 */
function releaseConnectionOnFail(conn, next) {
	conn.release();
	next();
}

module.exports = {
	validateIdParam: validateIdParam,
	validateData: validateData,
	addPaginationToQuery: addPaginationToQuery,
	throwErrorIfNoRowsAffected: throwErrorIfNoRowsAffected,
	releaseConnectionOnFail: releaseConnectionOnFail
};
