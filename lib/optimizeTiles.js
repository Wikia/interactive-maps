var Q = require('q');

module.exports = function optimizeTiles( data ) {
	var deferred = Q.defer();

	console.log('Optimizing tiles in folder:', data.dirs);
//	exec('imageOptim -d ' + dir, function(error, stdout, stderr){
//		console.log(stdout);
//		done();
//	})

	deferred.resolve( data );

	return deferred.promise;
};
