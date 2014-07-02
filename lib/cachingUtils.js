/**
 * Module to add custom HTTP Request headers
 */
'use strict';

var hostname = require('os').hostname(),
	config = require('./config'),
	logger = require('./logger'),
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
	this.header( 'Surrogate-Key', config.getServiceName() + '-' + key );
}

/**
 * @desc Removes cache buster value from an asset filename
 *
 * @param req {object}
 * @param res {object}
 * @param next {function}
 */
function filterCachebuster(req, res, next) {
	logger.debug('Filtering URL: ' + req.url);
	req.url = req.url.replace( /\/__cb\d+/, '' );
	logger.debug('Filtered to: ' + req.url);
	next();
}

/**
 * @desc Adds caching headers
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
function addCachingHeaders(req, res, next) {
	res.setCacheValidity = setCacheValidity;
	res.setSurrogateKey = setSurrogateKey;

	res.header({
		'X-Backend': hostname,
		'X-Cache': 'ORIGIN'
	});

	return next();
}

module.exports = {
	middleware: addCachingHeaders,
	filterCachebuster: filterCachebuster,

	// "constants"
	cacheLong: cachingTimes.cacheLong,
	cacheStandard: cachingTimes.cacheStandard,
	cacheShort: cachingTimes.cacheShort
};
