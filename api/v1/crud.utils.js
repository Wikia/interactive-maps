'use strict';

var Q = require('q');

/**
 * @desc Decorates error with a promise
 * @param {*} error
 * @returns {object} rejected promise
 */
function passError(error) {
	var deferred = Q.defer().reject(error);

	return deferred.promise;
}

module.exports = {
	passError: passError
};
