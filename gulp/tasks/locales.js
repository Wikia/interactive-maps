'use strict';

var gulp = require('gulp'),
	http = require('http'),
	Q = require('q'),
	fs = require('fs'),
	config = require('../../lib/config.js'),
	localesDir = './locales/',
	translationFile = localesDir + 'translations.json';

gulp.task('locales', function () {
	console.assert(typeof config.translationUrl === 'string', 'Translation URL not set');

	var deferred = Q.defer(),
		translationsData = '';

	http.get(config.translationUrl, function (res) {
		if (res.statusCode !== 200) {
			deferred.reject('Unable to download translations');
		}

		res.on('data', function (chunk) {
			translationsData += chunk;
		});

		res.on('end', function () {
			fs.writeFileSync(translationFile, translationsData);
			deferred.resolve();
		});
	});

	return deferred.promise;
});
