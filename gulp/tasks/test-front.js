'use strict';

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	karma = require('gulp-karma'),
	paths = require('../paths'),
	dependencies = gutil.env.nobuild ? [] : ['build'];

gulp.task('test-front', dependencies, function () {
	return gulp
		.src(paths.tests.front.files)
		.pipe(karma({
			configFile: paths.tests.front.config
		}))
		.on('error', function (error) {
			throw error;
		});
});
