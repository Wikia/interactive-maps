/**
 * Module that handles fetching an image from an URL
 */
'use strict';

var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	Q = require('q');

/**
 * @desc  uploading custom map image
 * @param data {object} object with data about map that will be created (name, image url, temp dir etc.)
 * @returns {object} - promise
 */

module.exports = function getFile(data) {
	var deferred = Q.defer(),
		fileName = url.parse(data.fileUrl).pathname.split('/').pop(),
		file = fs.createWriteStream(data.dir + fileName);

	console.log('Fetching file:', data.fileUrl);

	http.get(data.fileUrl, function (res) {
		res.on('data', function (data) {
			file.write(data);
		}).on('end', function () {
			file.end();
			console.log('File "' + fileName + '" downloaded to:', data.dir);

			data.image = fileName;

			deferred.resolve(data);
		});

	}).on('error', function (e) {
		deferred.reject(e);
	});

	return deferred.promise;
};
