'use strict';

var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config'),
	logger = require('./logger'),
	utils = require('./utils');

module.exports = function cleanupTiles(job) {
	var data = job.data,
		deferred = Q.defer(),
		context = {
			job: 'tiling',
			action: 'cleanup',
			dir: data.dir,
			minZoom: data.minZoom,
			maxZoom: data.MaxZoom
		};

	if (config.cleanup !== false) {
		if (data.status.removed) {
			deferred.resolve(job);
			logger.debug('Tiles already removed in: ' + data.dir);
		} else {
			logger.info('Removing tiles in: ' + data.dir, logger.getContext(context));

			exec('rm -rf ' + utils.getGlob(data.dir, data.minZoom, data.maxZoom), function (error, stdout, stderr) {
				if (error) {
					logger.error('Removing tiles failed', error);
					deferred.reject(job);
				} else {
					data.status.removed = true;
					job.save();
					logger.debug('Tiles removed in: ' + data.dir);
					deferred.resolve(job);
				}

			});
		}

	} else {
		logger.notice('Cleaning up disabled ' + data.dir, logger.getContext(context));

		deferred.resolve(job);
	}

	return deferred.promise;
};
