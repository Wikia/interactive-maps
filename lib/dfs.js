/**
 * Modules that handles DFS
 */
'use strict';

var Q = require('q'),
	config = require('./config'),
	glob = require('glob'),
	http = require('http'),
	url = require('url'),
	fs = require('fs'),
	auth,
	read = '.r:*';

function getFilePaths(dir, glo) {
	return function () {
		var deferred = Q.defer();

		glob(glo, {
			cwd: dir
		}, function (err, files) {
			if (!err) {
				deferred.resolve(files);
			} else {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	};
}

function uploadFiles(dir, name) {
	return function (files) {
		var deferred = Q.defer(),
			uri = url.parse(auth.url),
			path = uri.path + '/' + name + '/',
			length = files.length;

		files.forEach(function (file) {
			fs.readFile(dir + '/' + file, function (err, data) {
				if (err) {
					throw err; // Fail if the file can't be read.
				}

				var req = http.request({
					hostname: uri.hostname,
					path: path + file,
					method: 'PUT',
					headers: {
						'Content-Length': data.length,
						'Content-Type': 'image/' + file.split('.').pop(),
						'X-Auth-Token': auth.token,
						'X-Container-Read': read,
						'X-Container-Write': config.swift.swiftUser
					}
				}, function (res) {
					if (res.statusCode === 201) {
						console.log('save file', file);
					} else if (res.statusCode === 404) {
						console.log('Error saving file', file);
					}

					length -= 1;

					// We have all images in DFS now
					if (length <= 0) {
						deferred.resolve(res);
					}
				});

				req.write(data);
				req.end();
			});
		});

		return deferred.promise;
	};
}

function setBucket(auth, name) {
	var deferred = Q.defer(),
		uri = url.parse(auth.url);

	http.request({
		hostname: uri.hostname,
		path: uri.path + '/' + name,
		method: 'POST',
		headers: {
			'Content-Length': 0,
			'X-Auth-Token': auth.token,
			'X-Container-Read': read,
			'X-Container-Write': config.swift.swiftUser
		}
	}, function (res) {
		console.log('Setting readable bucket:', res.statusCode);

		if (res.statusCode === 202) {
			console.log('set');

			deferred.resolve(auth);
		} else {
			//TODO: throw an error or reject promise or maybe a retry ?
			deferred.reject(auth);
		}

	}).end();

	return deferred.promise;
}

function createBucket(name) {
	return function (auth) {
		var deferred = Q.defer(),
			uri = url.parse(auth.url);

		http.request({
			hostname: uri.hostname,
			path: uri.path + '/' + name,
			method: 'PUT',
			headers: {
				'Content-Length': 0,
				'X-Auth-Token': auth.token,
				'X-Container-Read': read,
				'X-Container-Write': config.swift.swiftUser
			}
		}, function (res) {
			console.log('Creating a bucket:', res.statusCode);

			if (res.statusCode === 201) {
				console.log('done');

				setBucket(auth, name)
					.then(function () {
						deferred.resolve(auth);
					});
				//not authorized or path has changed
			} else if (res.statusCode === 401 || res.statusCode === 404) {
				deferred.reject({
					message: 'Not authorized or wrong path given'
				});
			} else {
				//TODO: throw an error or reject promise or maybe a retry ?
				deferred.reject(auth);
			}

		}).end();

		return deferred.promise;
	};
}

function getToken(refresh) {
	var deferred = Q.defer(),
		uri = url.parse(config.swift.swiftAuthUrl);

	if (!auth || refresh) {
		console.log(refresh ? 'Refreshing token' : 'Token empty');

		http.get({
			hostname: uri.hostname,
			path: uri.path,
			headers: {
				'X-Auth-User': config.swift.swiftUser,
				'X-Auth-Key': config.swift.swiftKey
			}
		}, function (res) {
			if (res.statusCode === 204) {
				var headers = res.headers;

				auth = {
					url: headers['x-storage-url'],
					token: headers['x-auth-token']
				};

				console.log('Token recieved');

				deferred.resolve(auth);
			} else if (res.statusCode === 403) {
				deferred.reject({
					message: 'Most probably wrong key'
				});
			}
		});
	} else {
		deferred.resolve(auth);
	}

	return deferred.promise;
}

exports.sendFiles = function (bucket, dir, filePaths) {
	var deferred = Q.defer();

	getToken()
		.then(createBucket(bucket))
		.then(getFilePaths(dir, filePaths))
		.then(uploadFiles(dir, bucket))
		.then(deferred.resolve)
		.catch (function (err) {
			console.log(err);
		});

	return deferred.promise;
};
