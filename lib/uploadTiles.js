var Q = require('q'),
	dfs = require('./dfs');

module.export = function uploadTiles(bucket, done) {
	var deferred = Q.defer();
	//create bucket
	//upload images
	console.log('Uploading tiles for bucket:');
	deferred.resolve();

	return deferred.promise;
};
