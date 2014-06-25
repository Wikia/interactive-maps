/**
 * Module to add custom HTTP Request headers
 */
'use strict';

var hostname = require('os').hostname(),
	config = require('./config'),
	cacheLong = 2592000, // 30 days
	cacheStandard = 86400, // 24 hours
	cacheShort = 300;

/**
 * Helper method enables us to set different age for different routes
 *
 * @param {Integer} sMaxAge TTL on CDN
 */
function setCacheValidity( sMaxAge ) {
	this.header( 'Cache-Control', 'public, s-maxage=' + sMaxAge );
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
	},

	cacheLong: cacheLong,
	cacheStandard: cacheStandard,
	cacheShort: cacheShort

};
