'use strict';

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon');

gulp.task('dev', function () {
	nodemon({
		script: 'app.js',
		ext: 'js',
		ignore: ['tmp/**', 'node_modules/**'],
		env: {
			'NODE_ENV': 'devbox'
		}
	});
});

gulp.task('default', ['dev'], function () {

});
