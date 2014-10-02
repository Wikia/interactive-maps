'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	paths = require('../paths'),
	jasmine = require('gulp-jasmine'),
	dependencies = gutil.env.nobuild ? [] : ['build'];

gulp.task('test-back', dependencies, function () {
	var path = paths.tests(gutil.env.nobuild).back;

	/**
	 * gulp-jasmine in version 0.2.0 does not propagate the error if any of the test fails. There is open PR on
	 * GitHub for that: https://github.com/sindresorhus/gulp-jasmine/pull/12
	 */
	return gulp
		.src(path)
		.pipe(jasmine())
		.on('error', function () {
			process.exit(1);
		});
});
