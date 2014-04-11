'use strict';

var Q = require('q'),
	spawn = require('child_process').spawn,
	logger = require('./logger');

module.exports = function generateTiles(data) {
	var minZoom = data.minZoom,
		maxZoom = data.maxZoom,
		deferred = Q.defer(),
		script = 'gdal2tiles.py',
		args = ['-p', 'raster', '-z', minZoom + '-' + maxZoom, '-w', 'none', '-r', 'near', data.image, data.dir],
		gdal,
		context = {
			job: 'tiling',
			action: 'generating',
			minZoom: minZoom,
			maxZoom: maxZoom,
			script: script,
			args: args
		};

		logger.info('Running: ' + script + ' ' + args.join(' '), context);

	gdal = spawn(script, args);

	gdal.stdout.on('data', function (data) {
		//this way we can get back to user with update on tiling
		//logger.info( '' + data );
	});

	gdal.on('exit', function (code) {
		if (code === 0) {
			deferred.resolve(data);
			logger.info('Tiles generated into: ' + data.dir);
		} else {
			deferred.reject(data);
			logger.error('Exec error: ' + data);
		}

	});

	return deferred.promise;
};
