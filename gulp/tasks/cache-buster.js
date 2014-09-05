'use strict';

var gulp = require('gulp'),
	mkdirp = require('mkdirp'),
	fs = require('fs'),
	getDirName = require('path').dirname,
	path = './build/cachebuster.json',
	cbValue = new Date().getTime();

gulp.task('cache-buster', function () {
	mkdirp(getDirName(path), function () {
		fs.writeFileSync(path, JSON.stringify({
			cb: cbValue
		}));
		console.info('New cache buster value set to: ' + cbValue);
	});
});
