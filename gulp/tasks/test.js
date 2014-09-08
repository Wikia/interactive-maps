'use strict';

var gulp = require('gulp'),
	paths = require('../paths'),
	jasmine = require('gulp-jasmine');

gulp.task('test', [], function () {
	/**
	 * gulp-jasmine in version 0.2.0 does not propagate the error if any of the test fails. There is open PR on
	 * GitHub for that: https://github.com/sindresorhus/gulp-jasmine/pull/12
	 */
	return gulp
		.src(paths.specs)
		.pipe(jasmine())
		.on('error', function () {
			process.exit(1);
		});
});