'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	server = require('gulp-develop-server'),
	runSequence = require('run-sequence'),
	log = require('../utils/logger'),
	paths = require('../paths').watch,
	restart = function () {
		server.changed();
	};

gulp.task('watch', ['server'], function () {
	gulp.watch(paths.assets).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence(['front', 'cache-buster'], restart);
	});

	gulp.watch(paths.copyFiles).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('copy-files', restart);
	});

	gulp.watch(paths.nodeModules).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('node-modules', restart);
	});
});
