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
 * @desc Returns true if the SQL error should be handled
 *
 * Different versions of knex use different error names
 *
 * @param {string} errorName
 * @returns {boolean}
 */
function isHandledSQLError(errorName) {
	return ['OperationalError', 'RejectionError'].indexOf(errorName) !== -1;
}

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
		},
		codes = {
			'ER_DUP_ENTRY': 'Name needs to be unique',
			'ER_ROW_IS_REFERENCED_': 'Trying to delete row which is referenced',
			'ER_NO_REFERENCED_ROW': 'Cannot create reference to non-existing value'
		};

	logger.error(err.message, logger.getContext({
		err: err
	}));

	if (isHandledSQLError(err.clientError.name)) {
		result.message.message = err.clientError.cause.code;

		if (typeof codes[err.clientError.cause.code] !== 'undefined') {
			result.message.message = codes[err.clientError.cause.code];
		}
	}

	return result;
}

/**
 * @desc Return generic error
 *
 * @param status {number}
 * @param message {string}
 * @param details {*}
 * @returns {object}
 */
function genericError(status, message, details) {
	var result = {
		status: status,
		message: {
			message: message
		}
	};
	if (typeof details !== 'undefined') {
		result.message.details = details;
	}
	return result;
}

module.exports = {

	/**
	 * @desc Error handler
	 *
	 * @param err {object}
	 * @param req {object}
	 * @param res {object}
	 * @param next {function}
	 */
	middleware: function (err, req, res, next) {
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
	},

	/**
	 * @desc Returns Id should be number error
	 *
	 * @param id {number}
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
	 * @param errors {array}
	 * @returns {object}
	 */
	badRequestError: function (errors) {
		return genericError(
			400,
			'Bad request',
			errors
		);
	},

	/**
	 * @desc Returns elementNotFoundError
	 *
	 * @param name {string}
	 * @param id {number}
	 * @returns {{status: number, message: {message: string, details: string}}}
	 */
	elementNotFoundError: function (name, id) {
		return genericError(
			404,
			name + ' not found',
			'id: ' + id + ' not found'
		);
	},
	isHandledSQLError: isHandledSQLError
};
