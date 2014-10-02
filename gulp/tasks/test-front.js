'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	karma = require('gulp-karma'),
	paths = require('../paths'),
	dependencies = gutil.env.nobuild ? [] : ['build'];

gulp.task('test-front', dependencies, function () {
	paths = paths.tests(gutil.env.nobuild).front;

	return gulp
		.src(paths.files)
		.pipe(karma({
			configFile: paths.config
		}))
		.on('error', function (error) {
			throw error;
		});
});
