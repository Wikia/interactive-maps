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
 * @param {string} caller - action that calls the purge (e.g. mapUpdated); makes debugging easier
 */
function purgeUrl(url, caller) {
	purge(
		[
			getDataForScribe(data)
		]
	);
}

/**
 * @desc Gets data object for purging url
 * @param {String} url
 * @param {String} caller
 * @returns {Object}
 */
function getDataForScribeFromUrl(url, caller) {
	var data = getDefaultData(caller);
	data.url = url;
	return data;
}

/**
 * @desc Gets data object for purging surrogate key
 * @param {String} key
 * @param {String} caller - action that calls the purge (e.g. mapUpdated); makes debugging easier
 * @returns {Object}
 */
function getDataForScribeFromKey(key, caller) {
	var data = getDefaultData(caller);
	data.key = config.getServiceName() + '-' + key;
	return data;
}

/**
 * @desc Purges all the urls and keys from a data object defined like:
 * {
 *     urls: [Array of urls to purge],
 *     keys: [Array of surrogate keys to purge]
 * }
 * @param {Object} data
 * @param {String} caller - action that calls the purge (e.g. mapUpdated); makes debugging easier
 */
function purgeData(data, caller) {
	var dataForScribe = [];
	if (data.urls) {
		data.urls.forEach(function(url) {
			dataForScribe.push(getDataForScribeFromUrl(url, caller));
		});
	}
	if (data.keys) {
		data.keys.forEach(function(key) {
			dataForScribe.push(getDataForScribeFromKey(key, caller));
		});
	}
	purge(dataForScribe);
}

/**
 * @desc Purges objects by surrogate key
 *
 * @param {string} key surrogate key
 * @param {string} caller - action that calls the purge (e.g. mapUpdated); makes debugging easier
 */
function purgeKey(key, caller) {
	purge(
		[
			getDataForScribeFromKey(key, caller)
		]
	);
}

/**
 * @desc Returns default data to send to scribe
 *
 * @param {string} - action that calls the purge (e.g. mapUpdated); makes debugging easier
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
 * @param {Array} data - list of objects to be logged to scribe and purged
 */
function purge(data) {
	var scribeConnection = getScribe();
	scribeConnection.open(function(err) {
		if(err) {
			// scribe errors are being caught while creating Scribe instance in getScribe()
			logger.warning('Error while creating Scribe connection', err);
			return;
		}

		data.forEach(function (each) {
			scribeConnection.send(scribeKey, JSON.stringify(each));
			logger.debug('New Scribe request sent', data);
		});
		scribeConnection.close();
	});
}

module.exports = {
	// varnish purging methods
	purgeUrl: purgeUrl,
	purgeData: purgeData,
	purgeKey: purgeKey
};
