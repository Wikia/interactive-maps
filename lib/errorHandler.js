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

/**
 * @desc Return generic error
 *
 * @param status
 * @param message
 * @param details
 * @returns {{status: *, message: {message: *}}}
 */
function genericError(status, message, details) {
	var result = {
		status: status,
		message: {
			message: message,
		}
	};
	if (typeof details !== 'undefined') {
		result.message.details = details;
	}
	return result;
}

module.exports = {

	errorHandler: function (err, req, res, next) {

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
	},

	/**
	 * @desc Returns Id should be number error
	 *
	 * @param poiId {number}
	 * @returns {object}
	 */
	badNumberError: function (id) {
		return genericError(
			400,
			'Bad request',
			'id: ' + id + ' should be a number'
		);
	},

	/**
	 * @desc Returns Bad request errors
	 *
	 * @param errros {array}
	 * @returns {object}
	 */
	badRequestError: function (errros) {
		return genericError(
			400,
			'Bad request',
			errros
		);
	},

	/**
	 * @desc Returns Poi not found error
	 *
	 * @param poiId {number} - point id
	 * @returns {object}
	 */
	elementNotFoundError: function (name, id) {
		return {
			status: 404,
			message: {
				message: name + ' not found',
				details: 'id: ' + id + ' not found'
			}
		};
	}

}