'use strict';

var gulp = require('gulp'),
	gulpif = require('gulp-if'),
	ignore = require('gulp-ignore'),
	useref = require('gulp-useref'),
	uglify = require('gulp-uglify'),
	replace = require('gulp-replace'),
	environment = require('../utils/environment'),
	piper = require('../utils/piper'),
	paths = require('../paths'),
	options = require('../options');

gulp.task('build-dynamic', function () {
	var assets = useref.assets({
		searchPath: '/'
	});

	return piper(
		gulp.src(paths.buildDynamic, options.srcBase),
		gulpif(
			environment.isProduction,
			piper(
				ignore.exclude('*.js'),
				assets,
				gulpif('*.js', uglify()),
				assets.restore(),
				useref()
			)
		),
		gulpif(
			'*.html',
			replace(paths.cacheBuster.assetsPath.src, paths.cacheBuster.assetsPath.dest)
		),
		gulp.dest(paths.dest)
	);
});
