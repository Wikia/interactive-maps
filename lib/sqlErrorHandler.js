'use strict';

var logger = require('./logger');

/**
 * Handler for sql errors
 * @param err {object} - error object
 * @param req {object} - http request object
 * @returns {object} - user facing error object
 */

module.exports = function sqlErrorHandler(err, req) {
	logger.error(err, logger.getContext({response: 500, req: req}));

	if (typeof err !== 'object' || !err.hasOwnProperty('clientError')) {
		return {
			status: 500,
			message: 'Unexpected error'
		};
	}

	if (err.clientError.name === 'RejectionError') {
		var message = 'Cannot make reference to non-existing value';

		// TODO: refactor sql error handling so it returns better feedback to client
		if (err.clientError.cause.code === 'ER_DUP_ENTRY') {
			message = 'Name need to be unique';
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
};
