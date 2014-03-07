/**
 * Module that handles fetching an image from an URL
 */
'use strict';

var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	path = require('path'),
	Q = require('q');

module.exports = function getFile( fileUrl, destination ){
	var deferred = Q.defer(),
		file_name = url.parse(fileUrl).pathname.split('/').pop(),
		file = fs.createWriteStream(destination + file_name);

	console.log('Fetching file: ', fileUrl);

	http.get(fileUrl, function(res) {
		res.on('data', function(data) {
			file.write(data);
		}).on('end', function() {
			file.end();
			console.log('File downloaded to ' + destination);

			deferred.resolve(destination + file_name, file_name);
		});

	}).on('error', function(e) {
		deferred.reject(e)
	});

	return deferred.promise;
};
