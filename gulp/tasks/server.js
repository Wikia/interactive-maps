'use strict';

var gulp = require('gulp'),
	server = require('gulp-develop-server'),
	options = require('../options').server,
	paths = require('../paths'),
	environment = require('../utils/environment');

gulp.task('server', function () {
	if (!environment.isDev) {
		throw new Error('This task shouldn\'t be ran outside of dev environment');
	}

	server.listen(options);
	require(paths.destFull + '/server/kueServer');
});
