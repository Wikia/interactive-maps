'use strict';

var gulp = require('gulp'),
	paths = require('../paths'),
	options = require('../options');

gulp.task('build-static', function () {
	return gulp.src(paths.buildStatic, options.srcBase)
		.pipe(gulp.dest(paths.dest));
});
