'use strict';

require('./gulp');

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	jasmine = require('gulp-jasmine'),
	istanbul = require('gulp-istanbul');

gulp.task('dev', function () {
	nodemon({
		script: 'app.js',
		ext: 'js',
		ignore: ['tmp/**', 'node_modules/**'],
		env: {
			'NODE_ENV': 'devbox' //'production'
		}
	});

	//here at least it is not restarted on file changes
	//and this is not strictly needed for development
	require('./kueServer');
});

gulp.task('test', [], function () {
	/**
	 * gulp-jasmine in version 0.2.0 does not propagate the error if any of the test fails. There is open PR on
	 * GitHub for that: https://github.com/sindresorhus/gulp-jasmine/pull/12
	*/
	return gulp
		.src('specs/**')
		.pipe(jasmine())
		.on('error', function () {
			process.exit(1);
		});
});

gulp.task('coverage', function (cb) {
	gulp
		.src(['lib/*.js'])
		.pipe(istanbul()) // Covering files
		.on('end', function () {
			gulp
				.src('specs/**')
				.pipe(jasmine())
				.pipe(istanbul.writeReports()) // Creating the reports after tests were executed
				.on('end', cb);
		});
});
