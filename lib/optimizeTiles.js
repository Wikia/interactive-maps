var Q = require('q');

module.exports = function optimizeTiles( dirs ) {
	var deferred = Q.defer();

	console.log('Optimizing tiles in folder: ' + dirs);
//	exec('imageOptim -d ' + dir, function(error, stdout, stderr){
//		console.log(stdout);
//		done();
//	})

	deferred.resolve(dirs);

	return deferred.promise;
};
