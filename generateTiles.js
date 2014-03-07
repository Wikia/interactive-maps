var Q = require('q'),
	exec = require('child_process').exec;

module.exports = function generateTiles( imageFile, tempDir, minZoom, maxZoom ) {
	var deferred = Q.defer(),
		cmd = 'gdal2tiles.py -p raster -z ' +
			minZoom + '-' + maxZoom +
			' -w none ' +
			imageFile + ' ' + tempDir;

	console.log('Running:' + cmd);

	exec(cmd, function (error, stdout, stderr) {
		var dirs = [];

		console.log('stdout: ' + stdout);

		if (error !== null) {
			//callback( tempDir +  '/', error );
			deferred.reject(error);
			console.log('exec error: ' + error);
		} else {
			while ( minZoom <= maxZoom  ) {
				dirs.push(tempDir +  '/' + minZoom + '/');
				minZoom += 1;
			}

			deferred.resolve(dirs);
			console.log('Tiles generated into: ' + tempDir +  '/')
		}
	});

	return deferred.promise;
};
