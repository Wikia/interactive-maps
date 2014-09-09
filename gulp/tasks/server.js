'use strict';

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	options = require('../options').nodemon,
	paths = require('../paths'),
	environment = require('../utils/environment'),
	log = require('../utils/logger'),
	instance;

gulp.task('server', ['build'], function () {
	if (!environment.isDev) {
		throw new Error('This task shouldn\'t be run outside of dev environment');
	}

	if (!instance) {
		instance = nodemon(options)
			.on('restart', function () {
				log('Restarting server');
			});

		require(paths.baseFull + '/kueServer');
	} else {
		instance.emit('restart');
	}
});
