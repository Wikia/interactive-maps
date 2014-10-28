/**
 * Module to send logs to scribe
 */
'use strict';

var config = require('./config'),
	ScribeClass = require('scribe').Scribe,
	logger = require('./logger'),
	scribe,

	// "constants"
	scribeKey = 'varnish_purges';

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

	scribe.on('error', function(err) {
		logger.error(err);
	});

	return scribe;
}

/**
 * @desc Purges an URL
 *
 * @param {string} url
 * @param {string} caller - action that calls the purge (e.g. mapUpdated)
 */
function purgeUrl(url, caller) {
	var data = getDefaultData(caller);
	data.url = url;
	purge(data);
}

/**
 * @desc Purges all the urls in an array
 *
 * @param {Array} urls
 * @param {string} caller - action that calls the purge (e.g. mapUpdated)
 */
function purgeUrls(urls, caller) {
	urls.forEach(function(url) {
		purgeUrl(url, caller);
	});
}

/**
 * @desc Purges objects by surrogate key
 *
 * @param {string} key surrogate key
 * @param {string} caller
 */
function purgeKey(key, caller) {
	var data = getDefaultData(caller);
	data.key = config.getServiceName() + '-' + key;
	purge(data);
}

/**
 * @desc Returns default data to send to scribe
 *
 * @param {string} caller
 *
 * @returns {{time: *, method: *}}
 */
function getDefaultData(caller) {
	return {
		// we want timestamp in s not in ms
		'time': Math.floor(Date.now() / 1000),
		'method': caller,
		'service': config.getServiceName()
	};
}

/**
 * @desc Sends log to scribe
 *
 * @param {object} data
 */
function purge(data) {
	var scribeConnection = getScribe();
	scribeConnection.open(function(err) {
		if(err) {
			// scribe errors are being caught while creating Scribe instance in getScribe()
			return;
		}

		scribeConnection.send(scribeKey, JSON.stringify(data));
		scribeConnection.close();
	});
}

module.exports = {
	// varnish purging methods
	purgeUrl: purgeUrl,
	purgeUrls: purgeUrls,
	purgeKey: purgeKey
};
