'use strict';

var gulp = require('gulp'),
	paths = require('../paths'),
	nodemon = require('gulp-nodemon');

gulp.task('autoRestart', function () {
	nodemon({
		script: 'app.js',
		ext: 'js',
		ignore: [
			'tmp/**',
			paths.nodeModules.src
		],
		env: {
			'NODE_ENV': 'devbox' //'production'
		}
	});

	//here at least it is not restarted on file changes
	//and this is not strictly needed for development
	require('./../../kueServer');
});