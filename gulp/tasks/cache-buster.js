'use strict';

var gulp = require('gulp'),
	fs = require('fs'),
	mkdirp = require('mkdirp'),
	getDirName = require('path').dirname,
	paths = require('../paths');

gulp.task('cache-buster', function () {
	mkdirp(getDirName(paths.cacheBuster), function () {
		fs.writeFileSync(paths.cacheBuster, JSON.stringify({
			cb: new Date().getTime()
		}));
	});
});
