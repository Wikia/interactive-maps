'use strict';

var gulp = require('gulp'),
	environment = require('../utils/environment'),
	paths = require('../paths'),
	options = require('../options');

gulp.task('copy-files', function () {
	var files = (environment.isProduction) ?
		paths.copyFiles.concat(paths.ignoreScriptFiles) :
		paths.copyFiles;

	return gulp.src(files, options.srcBase)
		.pipe(gulp.dest(paths.dest));
});
