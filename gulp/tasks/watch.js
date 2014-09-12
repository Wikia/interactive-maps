'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	runSequence = require('run-sequence'),
	log = require('../utils/logger'),
	paths = require('../paths').watch;

gulp.task('watch', ['server'], function () {
	gulp.watch(paths.assets).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence(['front', 'cache-buster'], 'server');
	});

	gulp.watch(paths.copyFiles).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('copy-files', 'server');
	});

	gulp.watch(paths.nodeModules).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('node-modules', 'server');
	});
});
