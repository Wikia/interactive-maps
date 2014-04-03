'use strict';

var Q = require('q'),
	dfs = require('./dfs'),
	config = require('./config'),
	logger = require('./logger').getInstance();

module.exports = function uploadTiles(data) {
	var deferred = Q.defer(),
		filePaths = '{' + data.minZoom + '..' + data.maxZoom + '}/*/*.png',
		bucketName = encodeURIComponent(config.bucketPrefix + data.name.replace(/[ \/]/g, '_').trim());

	data.bucket = bucketName;
	logger.info('Uploading files to: ' + bucketName);

	if(config.upload !== false) {
		dfs.sendFiles(bucketName, data.dir, filePaths)
			.then(function () {
				deferred.resolve(data);
			});
	} else {
		deferred.resolve(data);
	}

	return deferred.promise;
};
