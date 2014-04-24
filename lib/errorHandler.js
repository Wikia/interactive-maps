/**
 * Module to handle errors
 * Whichever module that calls next(err)
 * will end up here and a proper message will be send to a user
 *
 * err:
 * {
 *		status: {http status code}
 *		message: {any type of a message}
 * }
 */
'use strict';

var logger = require('./logger');

/**
 * @desc Generates response error object for SQL errors
 *
 * @param err {object}
 */
function generateUserSQLError(err) {
	var result = {
		status: 500,
		message: {
			message: 'General database error'
		}
	};

	logger.error(err.message, logger.getContext({
		err: err
	}));

	if (err.clientError.name === 'RejectionError') {
		result.message.message = 'Cannot create reference to non-existing value',
		codes = {
			'ER_DUP_ENTRY': 'Name needs to be unique',
			'ER_ROW_IS_REFERENCED_': 'Trying to delete row which is referenced'
		};

		if (typeof codes[err.clientError.cause.code] !== 'undefined') {
			result.message.message = [err.clientError.cause.code];
		}
	}

	return result;
}

module.exports = function errorHandler(err, req, res, next) {

	if (err.hasOwnProperty('clientError')) {
		err = generateUserSQLError(err);
	}

	var status = err.status || 500;

	res.status(status);
	res.send(err.message);
	res.end();

	logger.error(err.message, logger.getContext({
		req: req,
		response: status
	}));
};
