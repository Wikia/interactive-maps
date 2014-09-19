'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	server = require('gulp-develop-server'),
	runSequence = require('run-sequence'),
	log = require('../utils/logger'),
	paths = require('../paths');

gulp.task('watch', ['server'], function () {
	gulp.watch(paths.buildDynamic).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence(['build-dynamic', 'cache-buster'], server.changed);
	});

	gulp.watch(paths.buildStatic).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence(['build-static', 'cache-buster'], server.changed);
	});

	gulp.watch(paths.nodeModules.list).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		runSequence('node-modules', server.changed);
	});
});
