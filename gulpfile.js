'use strict';

var gulp = require('gulp'),
	nodemon = require('gulp-nodemon'),
	jasmine = require('gulp-jasmine'),
	istanbul = require('gulp-istanbul'),
	exec = require('child_process').exec,
	localesDir = './locales/',
	translationUrl = 'http://mediawiki119.interactivemaps.wikia-dev.com/' +
		'wikia.php?controller=WikiaInteractiveMaps&method=translation',
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

gulp.task('test', function (cb) {
	gulp
		.src(['lib/*.js'])
		.pipe(istanbul()) // Covering files
		.on('end', function () {
			gulp
				.src('specs/**')
				.pipe(jasmine())
				.pipe(istanbul.writeReports()) // Creating the reports after tests runned
				.on('end', cb);
		});
});

gulp.task('update_translation', function () {
	var cmd = 'curl "' + translationUrl + '" -o ' + translationFile;
	exec(cmd, function () {
		// check if the downloaded translation is consistent
		var translation = require(translationFile);
		console.assert(typeof translation.messages === 'object', 'Translation is broken');
	});

});

gulp.task('default', ['dev'], function () {

});
