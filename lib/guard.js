/**
 * @desc simple express middleware that checks if request has secret token
 * as an authorization header
 * if method is different than GET
 * @param req {object} - http request object
 * @param res {object} - http response object
 * @param next {function} - callback function
 */
'use strict';

var token = require('./config').api.token,
	logger = require('./logger'),
	status;

module.exports = function guard(req, res, next) {
	if (req.method !== 'GET' && req.get('Authorization') !== token) {
		status = 401;
		logger.warning('Unauthorized action', logger.getContext({
			req: req,
			response: status
		}));
		next({
			status: status,
			message: 'Unauthorized'
		});
	} else {
		next();
	}
};
