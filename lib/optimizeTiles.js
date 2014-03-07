var Q = require('q'),
	exec = require('child_process').exec;

module.exports = function optimizeTiles( data ) {
	var deferred = Q.defer(),
		cmd = 'optipng -o7 ' + data.dir + '/**/**/*.png',
		duCommand = 'du -sh ' + data.dir;

	console.log('Optimizing tiles in folder:', data.dir);
	console.log('With command:', cmd);

	exec(duCommand, function(error, stdout, stderr){
		console.log(stdout.trim());

		exec(cmd, function(error, stdout, stderr){
			console.log(stdout);

			exec(duCommand, function(error, stdout, stderr){
				console.log(stdout.trim());

				deferred.resolve( data );
			});
		});
	});

	return deferred.promise;
};
