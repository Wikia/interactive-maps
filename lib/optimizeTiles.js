'use strict';

var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config'),
	logger = require('./logger'),
	utils = require('./utils');

/**
 * @desc optimize tile images
 * @param data {object} - object with tiles data
 * @returns {object} - promise
 */

module.exports = function optimizeTiles(data) {
	var deferred = Q.defer(),
		cmd = 'optipng -o7 ' + utils.getGlob(data.dir, data.minZoom, data.maxZoom, '/*/*.png');

	if (config.optimize !== false) {
		logger.info('Optimizing tiles in folder: ' + data.dir +' with command: ' + cmd);

		exec(cmd, function (error, stdout, stderr) {
			if (error) {
				deferred.reject(data);
				//logger.error(stderr);
			} else {
				deferred.resolve(data);
				logger.info(stdout);
			}
		});
	} else {
		logger.notice('Optimizing images disabled');
		deferred.resolve(data);
	}

	return deferred.promise;
};
