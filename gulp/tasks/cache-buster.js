'use strict';

var gulp = require('gulp'),
	mkdirp = require('mkdirp'),
	fs = require('fs'),
	gutil = require('gulp-util'),
	getDirName = require('path').dirname,
	path = require('../paths').cacheBuster,
	log = require('../utils/logger'),
	cbValue = new Date().getTime();

gulp.task('cache-buster', function () {
	mkdirp(getDirName(path), function () {
		fs.writeFileSync(path, JSON.stringify({
			cb: cbValue
		}));

		log('New cache buster value set to:', gutil.colors.green(cbValue));
	});
});
