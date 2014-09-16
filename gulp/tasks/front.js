'use strict';

var gulp = require('gulp'),
	gulpif = require('gulp-if'),
	useref = require('gulp-useref'),
	uglify = require('gulp-uglify'),
	replace = require('gulp-replace'),
	environment = require('../utils/environment'),
	piper = require('../utils/piper'),
	paths = require('../paths'),
	options = require('../options');

gulp.task('front', function () {
	var assets = useref.assets({
		searchPath: '/'
	});

	return piper(
		gulp.src(paths.front, options.srcBase),
		gulpif(
			environment.isProduction,
			piper(
				assets,
				gulpif('*.js', uglify()),
				assets.restore(),
				useref()
			)
		),
		gulpif(
			'*.html',
			replace(paths.assetsCBPath.src, paths.assetsCBPath.dest)
		),
		gulp.dest(paths.dest)
	);
});
