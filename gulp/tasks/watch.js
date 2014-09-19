'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	server = require('gulp-develop-server'),
	runSequence = require('run-sequence'),
	log = require('../utils/logger'),
	paths = require('../paths').watch;

gulp.task('watch', ['server'], function () {
	gulp.watch(paths.front).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence(['front', 'cache-buster'], server.changed);
	});

	gulp.watch(paths.copyFiles).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('copy-files', server.changed);
	});

	gulp.watch(paths.nodeModules).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('node-modules', server.changed);
	});
});
