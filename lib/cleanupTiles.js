'use strict';

var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config'),
	logger = require('./logger').getInstance();

module.exports = function cleanupTiles(data) {
	var deferred = Q.defer();

	if (config.cleanup !== false) {
		logger.info('Removing tiles in: ' + data.dir);

		exec('rm -rf ' + data.dir + '/{' + data.minZoom + '..' + data.MaxZoom + '}', function (error, stdout, stderr) {
			deferred.resolve(data);
		});
	} else {
		logger.info('Cleaning up disabled ' + data.dir);

		deferred.resolve(data);
	}

	return deferred.promise;
};
