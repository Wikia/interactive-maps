/**
 * Module to add custom HTTP Request headers
 */
'use strict';

var hostname = require('os').hostname();

/**
 * Helper method enables us to set different age for different routes
 *
 * @param {Integer} sMaxAge
 */
function setCacheValidity( sMaxAge ) {
	this.header( 'Cache-Control', 'public, max-age=0, s-maxage=' + sMaxAge );
}

module.exports = {

	/**
	 * @desc Adds caching headers
	 *
	 * @param req {object}
	 * @param res {object}
	 * @param next {function}
	 */
	middleware: function(req, res, next) {
		res.setCacheValidity = setCacheValidity;

		res.header({
			'X-Backend': hostname,
			'X-Cache': 'ORIGIN'
		});

		return next();
	}

};
