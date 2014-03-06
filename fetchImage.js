/**
 * Module that handles fetching an image from an URL
 */
'use strict';

var http = require('http'),
	url = require('url'),
	fs = require('fs'),
	path = require('path'),
	Q = require('q');

module.exports = function getFile( file_url, destination, callback ){
	var deferred = Q.defer(),
		file_name = url.parse(file_url).pathname.split('/').pop(),
		file = fs.createWriteStream(destination + file_name);

	http.get(file_url, function(res) {
		res.on('data', function(data) {
			file.write(data);
		}).on('end', function() {
			file.end();
			console.log(file_name + ' downloaded to ' + destination);

			deferred.resolve(destination + file_name, file_name);
		});

	}).on('error', function(e) {
		deferred.reject(e)
	});

	return deferred;
};
