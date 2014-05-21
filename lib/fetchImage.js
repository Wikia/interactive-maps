/**
 * Module that handles fetching an image from an URL
 */
'use strict';

var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	Q = require('q'),
	config = require('./config'),
	dfs = require('./dfs'),
	logger = require('./logger');

/**
 * @desc  uploading custom map image
 * @param data {object} object with data about map that will be created (name, image url, temp dir etc.)
 * @returns {object} - promise
 */

module.exports = function getFile(data) {
	var deferred = Q.defer(),
		fileName = url.parse(data.fileUrl).pathname.split('/').pop(),
		bucketName = encodeURIComponent(config.bucketPrefix + data.name.replace(/[ \/]/g, '_').trim()),
		file = fs.createWriteStream(data.dir + fileName);

	logger.debug('Fetching file: ' + data.fileUrl);

	http.get(data.fileUrl, function (res) {
		if (res.statusCode === 200) {
			res.on('data', function (data) {
				file.write(data);
			}).on('end', function () {
				file.end();
				logger.debug('File "' + fileName + '" downloaded to: ' + data.dir);

				if (config.upload !== false) {
					// store original image in DFS
					dfs
						.sendFiles(bucketName, data.dir, fileName)
						.then(function () {
							logger.info('Original image saved to ' + bucketName);

							data.image = fileName;

							deferred.resolve(data);
						})
						.catch (function (err) {
							logger.error('Failed saving original image in DFS ' + err);

							deferred.reject(err);
						});
				} else {
					data.image = fileName;
					deferred.resolve(data);
				}
			});
		} else {
			deferred.reject({
				message: 'Could not fetch file'
			});
		}
	}).on('error', function (err) {
		deferred.reject(err);
	});

	return deferred.promise;
};
