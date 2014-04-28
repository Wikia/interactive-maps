'use strict';

var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config'),
	logger = require('./logger'),
	utils = require('./utils');

/**
 * @desc optimize tile images
 * @param job {object} - job object
 * @returns {object} - promise
 */

module.exports = function optimizeTiles(job) {
	var data = job.data,
		deferred = Q.defer(),
		cmd = 'bash -c optipng ' + utils.getGlob(data.dir, data.minZoom, data.maxZoom, '/*/*.png');

	if (config.optimize !== false) {
		if (data.status.optimized) {
			deferred.resolve(job);
			logger.info('Tiles already optimized');
		} else {
			logger.info('Optimizing tiles in folder: ' + data.dir + ' with command: ' + cmd);

			exec(cmd, function (error, stdout, stderr) {
				if (error) {
					deferred.reject(job);
					// TODO: log useful stuff from 'stderr'
					logger.error('Optimizing failed');
				} else {
					if (stdout) {
						logger.debug(stdout);
					}

					data.status.optimized = true;
					job.save();
					deferred.resolve(job);
				}
			});
		}

	} else {
		logger.notice('Optimizing images disabled');
		deferred.resolve(job);
	}

	return deferred.promise;
};
