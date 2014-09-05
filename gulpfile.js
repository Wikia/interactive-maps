'use strict';

require('./gulp');

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	jasmine = require('gulp-jasmine'),
	istanbul = require('gulp-istanbul'),
	useref = require('gulp-useref'),
	gulpif = require('gulp-if'),
	uglify = require('gulp-uglify'),
	replace = require('gulp-replace'),
	exec = require('child_process').exec,
	fs = require('fs'),
	config = require('./lib/config.js'),
	localesDir = './locales/',
	translationFile = localesDir + 'translations.json';

gulp.task('dev', function () {
	nodemon({
		script: 'app.js',
		ext: 'js',
		ignore: ['tmp/**', 'node_modules/**'],
		env: {
			'NODE_ENV': 'devbox' //'production'
		}
	});

	//here at least it is not restarted on file changes
	//and this is not strictly needed for development
	require('./kueServer');
});

gulp.task('test', [], function () {
	/**
	 * gulp-jasmine in version 0.2.0 does not propagate the error if any of the test fails. There is open PR on
	 * GitHub for that: https://github.com/sindresorhus/gulp-jasmine/pull/12
	*/
	return gulp
		.src('specs/**')
		.pipe(jasmine())
		.on('error', function () {
			process.exit(1);
		});
});

gulp.task('coverage', function (cb) {
	gulp
		.src(['lib/*.js'])
		.pipe(istanbul()) // Covering files
		.on('end', function () {
			gulp
				.src('specs/**')
				.pipe(jasmine())
				.pipe(istanbul.writeReports()) // Creating the reports after tests were executed
				.on('end', cb);
		});
});

/**
* Translation is currently downloaded from MediaWiki as we use the existing infrastructure for translations.
* The translationUrl is defined in config. After the translation is downloaded the task makes a quick sanity check
* in case something is wrong with the translation JSON file.
*/
gulp.task('update-translation', function () {
	console.assert(typeof config.translationUrl === 'string', 'Translation URL not set');
	var cmd = 'curl "' + config.translationUrl + '" -o ' + translationFile;
	exec(cmd, function () {
		// check if the downloaded translation is consistent
		var translation = require(translationFile);
		console.assert(typeof translation.messages === 'object', 'Translation is broken');
	});

});

/*gulp.task('default', ['dev'], function () {

});*/

gulp.task('bump-cachebuster', function () {
	var mkdirp = require('mkdirp'),
		getDirName = require('path').dirname,
		path = './build/cachebuster.json';

	mkdirp(getDirName(path), function () {
		fs.writeFileSync(path, JSON.stringify({
			cb: new Date().getTime()
		}));
	});
});

gulp.task('copy-files', function () {
	return gulp.src([
		'./api/**/*.*',
		'!./api/v1/render.html',
		'./assets/**/*.*',
		'!./assets/**/*.js',
		'./lib/*.*',
		'./locales/*.*',
		'./specs/*.*',
		'./tools/*.*',
		'./apiServer.js',
		'./app.js',
		'./gulpfiles.js',
		'./kueServer.js',
		'./newrelic.js'
	], {
		base: './'
	})
	.pipe(gulp.dest('build'));
});

gulp.task('assets-cachebuster', function () {
	return gulp.src('api/v1/render.html', {
		base: './'
	})
	.pipe(replace('/assets/', '/assets/{{cacheBuster}}/'))
	.pipe(gulp.dest('build'));
});

gulp.task('scripts-contacenate', function () {
	var assets = useref.assets({
		searchPath: '/'
	});

	return gulp.src('api/v1/render.html', {
		base: './'
	})
	.pipe(assets)
	.pipe(gulpif('*.js', uglify()))
	.pipe(assets.restore())
	.pipe(useref())
	.pipe(gulp.dest('build'));
});

gulp.task('build', ['scripts', 'update-translation', 'copy-files', 'bump-cachebuster'], function () {

});
