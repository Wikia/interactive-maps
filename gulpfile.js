'use strict';

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

gulp.task('test', function (cb) {
	gulp.src(['lib/*.js', 'api/v1/*.js'])
		.pipe(istanbul()) // Covering files
	.on('end', function () {
		gulp.src('specs/**')
			.pipe(jasmine())
			.pipe(istanbul.writeReports()) // Creating the reports after tests runned
		.on('end', cb);
	});
});

gulp.task('default', ['dev'], function () {

});
