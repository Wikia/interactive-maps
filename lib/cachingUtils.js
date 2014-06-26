/**
 * Module to add custom HTTP Request headers
 */
'use strict';

var hostname = require('os').hostname(),
	cachingTimes = {
		// "constants"
		cacheLong: 2592000, // 30 days
		cacheStandard: 86400, // 24 hours
		cacheShort: 300
	};

/**
 * @desc Helper method enables us to set different age for different routes
 *
 * @param {integer} sMaxAge TTL on CDN
 */
function setCacheValidity( sMaxAge ) {
	this.header( 'Cache-Control', 'public, s-maxage=' + sMaxAge );
}

/**
 * @desc Helper method enables us to set custom surrogate keys for different routes
 *
 * @param {string} key the name of surrogate key
 */
function setSurrogateKey( key ) {
	this.header( 'Surrogate-Key', key );
}

module.exports = {

	/**
	 * @desc Adds caching headers
	 *
	 * @param {object} req
	 * @param {object} res
	 * @param {function} next
	 */
	middleware: function(req, res, next) {
		res.setCacheValidity = setCacheValidity;
		res.setSurrogateKey = setSurrogateKey;

		res.header({
			'X-Backend': hostname,
			'X-Cache': 'ORIGIN'
		});

		return next();
	},

	// "constants"
	cacheLong: cachingTimes.cacheLong,
	cacheStandard: cachingTimes.cacheStandard,
	cacheShort: cachingTimes.cacheShort
};
