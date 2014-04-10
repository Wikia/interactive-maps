'use strict';

var Q = require('q'),
	spawn = require('child_process').spawn,
	logger = require('./logger'),
	script = 'gdal2tiles.py';

module.exports = function generateTiles(job) {
	var data = job.data,
		minZoom = data.minZoom,
		maxZoom = data.maxZoom,
		deferred = Q.defer(),
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

	if (data.status.tiles) {
		logger.info('Tiles already generated in: '  + data.dir);
		deferred.resolve(job);
	} else {
		logger.info('Running: ' + script + ' ' + args.join(' '), logger.getContext(context));

		gdal = spawn(script, args);

		gdal.stdout.on('data', function (data) {
			//this way we can get back to user with update on tiling
			//logger.debug( '' + data );
		});

		gdal.on('exit', function (code) {
			if (code === 0) {
				data.status.tiles = 1;
				job.save();
				logger.info('Tiles generated into: ' + data.dir);
				deferred.resolve(job);
			} else {
				logger.error('Exec error: ' + data);
				deferred.reject(job);
			}
		});
	}

	return deferred.promise;
};
