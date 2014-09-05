'use strict';

var gulp = require('gulp'),
	exec = require('child_process').exec,
	config = require('../../lib/config.js'),
	localesDir = '../../locales/',
	translationFile = localesDir + 'translations.json';

gulp.task('locales', function () {
	console.assert(typeof config.translationUrl === 'string', 'Translation URL not set');
	var cmd = 'curl "' + config.translationUrl + '" -o ' + translationFile;
	exec(cmd, function () {
		// check if the downloaded translation is consistent
		var translation = require(translationFile);
		console.assert(typeof translation.messages === 'object', 'Translation is broken');
	});
});
