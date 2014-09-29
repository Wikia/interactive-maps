'use strict';

var gulp = require('gulp'),
	http = require('http'),
	Q = require('q'),
	mkdirp = require('mkdirp'),
	fs = require('fs'),
	getDirName = require('path').dirname,
	paths = require('../paths').locales;

gulp.task('locales', function () {
	if (typeof paths.src !== 'string') {
		throw new Error('Translation URL not set');
	}

	var deferred = Q.defer(),
		translationsData = '';

	http.get(paths.src, function (res) {
		if (res.statusCode !== 200) {
			deferred.reject('Unable to download translations');
		}

		res.on('data', function (chunk) {
			translationsData += chunk;
		});

		res.on('end', function () {
			mkdirp(getDirName(paths.dest), function () {
				fs.writeFileSync(paths.dest, translationsData);
				deferred.resolve();
			});
		});
	});

	return deferred.promise;
});
