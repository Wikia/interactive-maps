'use strict';

var Q = require('q'),
	dfs = require('./dfs'),
	config = require('./config'),
	logger = require('./logger');

module.exports = function uploadTiles(job) {
	var data = job.data,
		deferred = Q.defer(),
		filePaths = '{' + data.minZoom + '..' + data.maxZoom + '}/*/*.png',
		bucketName = encodeURIComponent(config.bucketPrefix + data.name.replace(/[ \/]/g, '_').trim());

	data.bucket = bucketName;
	logger.info('Uploading files to: ' + bucketName);

	if(config.upload !== false) {
		if(data.status.uploaded) {
			deferred.resolve(job);
			logger.debug('Tiles already upladed to ' + bucketName);
		} else {
			dfs.sendFiles(bucketName, data.dir, filePaths)
				.then(function () {
					logger.debug('Tiles upladed to ' + bucketName);
					data.status.uploaded = true;
					job.save();
					deferred.resolve(job);
				});
		}

	} else {
		deferred.resolve(job);
	}

	return deferred.promise;
};
