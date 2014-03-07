var Q = require('q');

module.exports = function cleanupTiles( dirs ){
	var deferred = Q.defer();
	//remove local files
	console.log('Removing tiles in: ' + dirs);

	deferred.resolve( dirs );

	return deferred.promise;
};
