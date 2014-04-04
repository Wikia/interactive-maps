/**
 * @desc simple express middleware that checks if request has secret token
 * as an authorization header
 * if method is different than GET
 * @param req {object} - http request object
 * @param res {object} - http response object
 * @param next {function} - callback function
 */
'use strict';

var token = require('./config').api.token;

module.exports = function guard(req, res, next) {
	if (req.method !== 'GET' && req.headers.authorization !== token) {
		next({
			status: 401,
			message: 'Unauthorized'
		});
	} else {
		next();
	}
};
