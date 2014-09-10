'use strict';

var gulp = require('gulp'),
	http = require('http'),
	Q = require('q'),
	mkdirp = require('mkdirp'),
	fs = require('fs'),
	getDirName = require('path').dirname,
	config = require('../../lib/config.js'),
	path = require('../paths').locales;

gulp.task('locales', function () {
	if (typeof config.translationUrl !== 'string') {
		throw new Error('Translation URL not set');
	}

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
			mkdirp(getDirName(path), function () {
				fs.writeFileSync(paths.locales, translationsData);
				deferred.resolve();
			});
		});
	});

	return deferred.promise;
});
