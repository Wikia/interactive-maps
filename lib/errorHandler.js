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

module.exports = function errorHandler(err, req, res, next) {
	res.status(err.status || 500);
	res.send(err.message);
	res.end();
};
