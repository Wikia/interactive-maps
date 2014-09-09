'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	log = require('../utils/logger'),
	paths = require('../paths');

gulp.task('watch', ['build'], function () {
	gulp.watch(paths.watch).on('change', function (event) {
		log('File changed:', gutil.colors.green(event.path));
		gulp.start(['build', 'server']);
	});
});
