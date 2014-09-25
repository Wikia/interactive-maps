'use strict';

var Q = require('q'),
	errorHandler = require('./../../lib/errorHandler'),
	jsonValidator = require('./../../lib/jsonValidator'),
	mapConfig = require('./map.config'),
	poiConfig = require('./poi.config');

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
 * @param {String} operation an operation for which it should be validated (taken from cruds' configs)
 */
function validateData(reqBody, operation) {
	var errors;

	switch (operation) {
		case mapConfig.operations.insert:
			errors = jsonValidator.validateJSON(reqBody, mapConfig.createSchema);
			break;
		case mapConfig.operations.update:
			errors = jsonValidator.validateJSON(reqBody, mapConfig.updateSchema);
			break;
		case poiConfig.poiOperations.insert:
			errors = jsonValidator.validateJSON(reqBody, poiConfig.createSchema);
			break;
		case poiConfig.poiOperations.update:
			errors = jsonValidator.validateJSON(reqBody, poiConfig.updateSchema);
			break;
		default:
			errors = [];
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
