'use strict';

var gulp = require('gulp'),
	exec = require('child_process').exec,
	Q = require('q'),
	config = require('../../lib/config.js'),
	localesDir = '../../locales/',
	translationFile = localesDir + 'translations.json';

gulp.task('locales', function () {
	console.assert(typeof config.translationUrl === 'string', 'Translation URL not set');
	var cmd = 'curl "' + config.translationUrl + '" -o ' + translationFile;
	return exec(cmd, function () {
		// check if the downloaded translation is consistent
		var translation = require(translationFile),
			deferred = Q.defer();

		if (typeof translation.messages === 'object') {
			deferred.reject('Translation is broken');
		} else {
			deferred.resolve('Translation updated');
		}

		return deferred.promise;
	});
});
