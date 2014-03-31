'use strict';

var Q = require('q'),
	spawn = require('child_process').spawn;

module.exports = function generateTiles(data) {
	var minZoom = data.minZoom,
		maxZoom = data.maxZoom,
		deferred = Q.defer(),
		script = 'gdal2tiles.py',
		args = ['-p', 'raster', '-z', minZoom + '-' + maxZoom, '-w', 'none', '-r', 'near', data.image, data.dir],
		gdal;

	console.log('Running:', script, args.join(' '));

	gdal = spawn(script, args);

	gdal.stdout.on('data', function (data) {
		//this way we can get back to user with update on tiling
		//console.log( '' + data );
	});

	gdal.on('exit', function (code) {
		if (code === 0) {
			deferred.resolve(data);
			console.log('Tiles generated into:', data.dir);
		} else {
			deferred.reject(data);
			console.log('exec error:', data);
		}

	});

	return deferred.promise;
};
