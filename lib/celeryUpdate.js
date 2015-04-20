/**
 * Module to send purge requests to celery worker
 */
'use strict';

var config = require('./config'),
	celery = require('node-celery'),
	logger = require('./logger'),
	taskQueue = require('./taskQueue'),
	celery_client = getCelery();

/**
 * @desc Gets Celery client
 *
 * @returns {celery}
 */

function getCelery() {
	var celeryBrokerUrl = taskQueue.createTaskBrokerUrl(config.taskBroker);
	var client;

	if (celeryBrokerUrl && !celery_client) {
		client = celery.createClient({
			CELERY_BROKER_URL: celeryBrokerUrl,
			CELERY_ROUTES: {
				'celery_workers.purger.purge': {
					queue: 'purger'
				}
			}
		});
		client.on('error', function(err) {
			logger.error(err);
		});
	}
	return client;
}

/**
 * @desc Purges a url
 * @param {String} url
 * @param {String} caller
 * @returns {Object}
 */
function purgeUrl(url, caller) {
	data.urls = [ url ];
	purgeData(data, caller);
}

/**
 * @desc Purges objects by surrogate key
 *
 * @param {string} key - full surrogate key (with serviceName prefix)
 * @param {string} caller - action that calls the purge (e.g. mapUpdated); makes debugging easier
 */

function purgeKey(key, caller) {
	data.keys = [ key ];
	purgeData(data, caller);
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
	var urls = data.urls || [];
	var keys = data.keys || [];
	var service_name = config.getServiceName().replace('-', '_');
	logger.debug("Purging celery:");
	logger.debug(urls);
	logger.debug(keys);
	celery_client.call('celery_workers.purger.purge', [urls, keys, service_name] );
}

module.exports = {
	// varnish purging methods
	purgeUrl: purgeUrl,
	purgeData: purgeData,
	purgeKey: purgeKey
};

