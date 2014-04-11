'use strict';

var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config'),
	logger = require('./logger');

module.exports = function cleanupTiles(data) {
	var deferred = Q.defer(),
		context = {
			job: 'tiling',
			action: 'cleanup',
			dir: data.dir,
			minZoom: data.minZoom,
			maxZoom: data.MaxZoom
		};

	if (config.cleanup !== false) {
		logger.info('Removing tiles in ' + data.dir, logger.getContext(context));

		exec('rm -rf ' + data.dir + '/{' + data.minZoom + '..' + data.MaxZoom + '}', function (error, stdout, stderr) {
			deferred.resolve(data);
		});
	} else {
		logger.info('Cleaning up disabled in ' + data.dir, logger.getContext(context));

		deferred.resolve(data);
	}

	return deferred.promise;
};
