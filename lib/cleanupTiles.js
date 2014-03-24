'use strict';

var Q = require('q'),
	exec = require('child_process').exec,
	config = require('./config');

module.exports = function cleanupTiles(data) {
	var deferred = Q.defer();

	if (config.cleanup !== false) {
		console.log('Removing tiles in:', data.dir);

		exec('rm -rf ' + data.dir + '/{' + data.minZoom + '..' + data.MaxZoom + '}', function (error, stdout, stderr) {
			deferred.resolve(data);
		});
	} else {
		console.log('Cleaning up disabled', data.dir);

		deferred.resolve(data);
	}

	return deferred.promise;
};
