'use strict';

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon');

gulp.task('dev', function () {
	nodemon({
		script: 'app.js',
		ext: 'js',
		env: {
			'NODE_ENV': 'devbox',
			'CONFIG_PATH': '/Users/jolek/WIKIA/devbox/config/'
		}
	});
});

gulp.task('default', ['dev'], function () {

});
