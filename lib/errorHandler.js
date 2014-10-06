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
 * @param {String} errorName
 * @returns {Boolean}
 */
function isHandledSQLError(errorName) {
	return ['OperationalError', 'RejectionError'].indexOf(errorName) !== -1;
}

/**
 * @desc Generates response error object for SQL errors
 *
 * @param {Object} err
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
			result.message.code = err.clientError.cause.code;
			result.message.message = codes[err.clientError.cause.code];
		}
	}

	return result;
}

/**
 * @desc Return generic error
 *
 * @param {Number} status
 * @param {String} message
 * @param {*} details
 * @returns {Object}
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

/**
 * @desc Returns elementNotFoundError
 *
 * @param {String} name
 * @param {Number} id
 * @returns {{status: number, message: {message: string, details: string}}}
 */
function elementNotFoundError (name, id) {
	return genericError(
		404,
		name + ' not found',
		'id: ' + id + ' not found'
	);
}

/**
 * @desc Serves 404 HTTP error in a form of JSON
 * @param {Object} req HTTP request object
 * @param {Object} res HTTP request object
 * @param {Function} next callback for express.js
 */
function serveNotFoundError (req, res, next) {
	res.send({message: 'Not found'}, 404);
}

module.exports = {

	/**
	 * @desc Error handler
	 *
	 * @param {Object} err
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Function} next
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
	 * @param {Number} id
	 * @returns {Object} object
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
	 * @param {Array} errors
	 * @returns {Object}
	 */
	badRequestError: function (errors) {
		return genericError(
			400,
			'Bad request',
			errors
		);
	},

	elementNotFoundError: elementNotFoundError,
	serveNotFoundError: serveNotFoundError,
	isHandledSQLError: isHandledSQLError
};
