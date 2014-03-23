var Q = require('q'),
	dfs = require('./dfs'),
	config = require('./config');

module.exports = function uploadTiles( data ) {
	var deferred = Q.defer(),
		filePaths = '{' + data.minZoom + '..' + data.maxZoom + '}/*/*.png',
		bucketName = encodeURIComponent(config.bucketPrefix + data.name.replace(/[ \/]/g, '_').trim());

	data.bucket = bucketName;
	console.log('Uploading files to:', bucketName);

	dfs.sendFiles(bucketName, data.dir, filePaths).
		then(function(){
			deferred.resolve( data );
		});

	return deferred.promise;
};
