'use strict';

var Q = require('q'),
	errorHandler = require('./../../lib/errorHandler');

/**
 * @desc Decorates error with a promise
 * @param {*} error
 * @returns {object} rejected promise
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

module.exports = {
	passError: passError,
	validateIdParam: validateIdParam
};
