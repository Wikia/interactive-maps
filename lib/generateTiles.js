var Q = require('q'),
	spawn = require('child_process').spawn;

module.exports = function generateTiles(data) {
	var minZoom = data.minZoom,
		maxZoom = data.maxZoom,
		deferred = Q.defer(),
		script = 'gdal2tiles.py',
		args = ['-e', '-p', 'raster', '-z', minZoom + '-' + maxZoom, '-w', 'none', data.image, data.dir];

	console.log('Running:', script, args);

	gdal = spawn(script, args, {
		cwd: '/'
	});

	gdal.stdout.on('data', function (data) {
		//console.log( '' + data );
	});

	gdal.on('exit', function (code) {
		if (code === 0) {
			deferred.resolve(data);
			console.log('Tiles generated into:', data.dir)
		} else {
			deferred.reject(data);
			console.log('exec error:', data);
		}

	});

	return deferred.promise;
};
