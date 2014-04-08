'use strict';

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	jasmine = require('gulp-jasmine');

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

gulp.task('test', function () {
	gulp.src('specs/**')
		.pipe(jasmine());
});

gulp.task('default', ['dev'], function () {

});
