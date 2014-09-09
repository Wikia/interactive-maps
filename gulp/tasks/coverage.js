'use strict';

var gulp = require('gulp'),
	paths = require('../paths'),
	jasmine = require('gulp-jasmine'),
	istanbul = require('gulp-istanbul');

gulp.task('coverage', function (cb) {
	gulp
		.src([paths.lib])
		.pipe(istanbul()) // Covering files
		.on('end', function () {
			gulp
				.src(paths.specs)
				.pipe(jasmine())
				.pipe(istanbul.writeReports()) // Creating the reports after tests were executed
				.on('end', cb);
		});
});
