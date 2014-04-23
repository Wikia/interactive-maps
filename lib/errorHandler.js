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

	logger.error(err.message, logger.getContext({
		err: err
	}));

	if (err.clientError.name === 'RejectionError') {
		var message = 'Cannot make reference to non-existing value';

		// TODO: refactor sql error handling so it returns better feedback to client
		if (err.clientError.cause.code === 'ER_DUP_ENTRY') {
			message = 'Name needs to be unique';
		}

		return {
			status: 500,
			message: message
		};
	}

	return{
		status: 500,
		message: 'General database error'
	};
}

module.exports = function errorHandler(err, req, res, next) {

	if ( err.hasOwnProperty('clientError') ) {
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
