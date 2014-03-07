var Q = require('q'),
	exec = require('child_process').exec;

module.exports = function generateTiles( data ) {
	var minZoom = data.minZoom,
		maxZoom = data.maxZoom,
		deferred = Q.defer(),
		cmd = 'gdal2tiles.py -e -p raster -z ' +
			minZoom + '-' + maxZoom +
			' -w none ' +
			data.image + ' ' + data.dir;

	console.log('Running:' + cmd);

	exec(cmd, function (error, stdout, stderr) {
		var dirs = [];

		console.log('stdout:', stdout);

		if (error !== null) {
			//callback( tempDir +  '/', error );
			deferred.reject(error);
			console.log('exec error:', error);
		} else {
			while ( minZoom <= maxZoom  ) {
				dirs.push(data.dir +  '/' + minZoom + '/');
				minZoom += 1;
			}

			data.dirs = dirs;

			deferred.resolve( data );
			console.log('Tiles generated into:', data.dir )
		}
	});

	return deferred.promise;
};
