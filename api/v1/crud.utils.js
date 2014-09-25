'use strict';

var Q = require('q'),
	errorHandler = require('./../../lib/errorHandler'),
	jsonValidator = require('./../../lib/jsonValidator');

/**
 * @desc Decorates error with a promise
 * @param {*} error
 * @returns {Object} rejected promise
 */
function passError(error) {
	var deferred = Q.defer().reject(error);

	return deferred.promise;
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

module.exports = {
	passError: passError,
	validateIdParam: validateIdParam,
	validateData: validateData
};
