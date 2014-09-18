'use strict';

var gulp = require('gulp'),
	karma = require('gulp-karma'),
	paths = require('../paths');

gulp.task('test-front', ['build'], function () {
	return gulp
		.src(paths.tests.front.files)
		.pipe(karma({
			configFile: paths.tests.front.config
		}))
		.on('error', function (error) {
			throw error;
		});
});
