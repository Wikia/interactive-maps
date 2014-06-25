/**
 * Module to add custom HTTP Request headers
 */
'use strict';

var hostname = require('os').hostname(),
	config = require('./config'),
	ScribeClass = require('scribe').Scribe,
	scribe,

	// "constants"
	cacheLong = 2592000, // 30 days
	cacheStandard = 86400, // 24 hours
	cacheShort = 300,
	scribeKey = 'varnish_purges';

/**
 * @desc Helper method enables us to set different age for different routes
 *
 * @param {Integer} sMaxAge TTL on CDN
 */
function setCacheValidity( sMaxAge ) {
	this.header( 'Cache-Control', 'public, s-maxage=' + sMaxAge );
}

/**
 * @desc Helper method enables us to set custom surrogate keys for different routes
 *
 * @param {String} key the name of surrogate key
 */
function setSurrogateKey( key ) {
	this.header( 'Surrogate-Key', key );
}

/**
 * @desc Gets Scribe instance to use for sending log entries
 *
 * @returns {Scribe}
 */
function getScribe() {
	var scribeHost = config.scribeHost || '127.0.0.1',
		scribePort = config.scribePort || 1463;

	if( !scribe ) {
		scribe = new ScribeClass( scribeHost, scribePort );
	}

	return scribe;
}

/**
 * @desc Purges an URL
 *
 * @param {String} url
 * @param {String} caller
 */
function purgeUrl(url, caller) {
	var data = getDefaultData(caller);
	data.url = url;
	purge(data);
}

/**
 * @desc Purges objects by surrogate key
 *
 * @param {String} key surrogate key
 * @param {String} caller
 */
function purgeKey(key, caller) {
	var data = getDefaultData(caller);
	data.key = key;
	purge(data);
}

/**
 * @desc Returns default data to send to scribe
 *
 * @param {String} caller
 *
 * @returns {{time: *, method: *}}
 */
function getDefaultData(caller) {
	return {
		'time': Date.now(),
		'method': caller
	};
}

/**
 * @desc Sends log to scribe
 *
 * @param data
 */
function purge(data) {
	var scribeConnection = getScribe();
	scribeConnection.open(function(err) {
		if(err) {
			return console.log(err);
		}

		scribeConnection.send(scribeKey, JSON.stringify(data));
		scribeConnection.close();
	});
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
		res.setSurrogateKey = setSurrogateKey;

		res.header({
			'X-Backend': hostname,
			'X-Cache': 'ORIGIN'
		});

		return next();
	},

	// varnish purging methods
	purgeUrl: purgeUrl,
	purgeKey: purgeKey,

	// "constants"
	cacheLong: cacheLong,
	cacheStandard: cacheStandard,
	cacheShort: cacheShort

};
