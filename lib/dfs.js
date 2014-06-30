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
	logger = require('./logger'),
	uri = url.parse(config.swift.swiftAuthUrl),
	hostname = uri.hostname;

/**
 * @desc Create HTTP request object
 *
 * @param {string} path
 * @param {string} method HTTP Method
 * @param {object} headers
 * @returns {object}
 */
function createRequestObject(path, method, headers) {
	if (config.useDfsProxy) {
		headers.Host = hostname;
		return {
			host: config.dfsProxy.host,
			port: config.dfsProxy.port,
			path: uri,
			headers: headers
		};
	}
	return {
		hostname: hostname,
		path: path,
		method: method,
		headers: headers
	};
}

/**
 * @desc Gets an array of files that match a pattern in a given dir
 *
 * @param {string} dir path where all files are stored ie. /tmp/
 * @param {string} pattern ie /{0..2}/0.png
 * @returns {Function} that returns promise
 */
function getFilePaths(dir, pattern) {
	return function (auth) {
		var deferred = Q.defer();

		glob(pattern, {
			cwd: dir
		}, function (err, files) {
			if (!err) {
				deferred.resolve({
					files: files,
					auth: auth
				});
			} else {
				deferred.reject(err);
			}
		});

		return deferred.promise;
	};
}

/**
 * @param {string} dir path where all files are stored ie. /tmp/
 * @param {string} name bucket name
 * @returns {Function} that returns promise
 */
function uploadFiles(dir, name) {
	return function (data) {
		var auth = data.auth,
			files = data.files,
			deferred = Q.defer(),
			uri = url.parse(auth.url),
			path = uri.path + '/' + name + '/',
			length = files.length;

		files.forEach(function (file) {
			fs.readFile(dir + '/' + file, function (err, data) {
				if (err) {
					logger.error('Cannot read file', {
						dir: dir,
						file: file,
						url: url
					});
					throw err; // Fail if the file can't be read.
				}

				var req = http.request(createRequestObject(
					path + file,
					'PUT',
					{
						'Content-Length': data.length,
						'Content-Type': 'image/' + file.split('.').pop(),
						'X-Auth-Token': auth.token,
						'X-Container-Read': '.r:*',
						'X-Container-Write': config.swift.swiftUser
					}
				), function (res) {
					if (res.statusCode === 201) {
						logger.debug('Saved file: ' + file);
					} else if (res.statusCode === 404) {
						logger.error('Cannot save file ' + file);
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

/**
 * @param {object} auth authorization token and url
 * @param {string} name bucket name
 * @returns {defer.promise}
 */
function setBucket(auth, name) {
	var deferred = Q.defer(),
		uri = url.parse(auth.url),
		context;

	http.request(createRequestObject(
		uri.path + '/' + name,
		'POST',
		{
			'Content-Length': 0,
			'X-Auth-Token': auth.token,
			'X-Container-Read': '.r:*',
			'X-Container-Write': config.swift.swiftUser
		}
	), function (res) {
		context = {
			job: 'tiling',
			action: 'setting bucket',
			path: uri.path,
			verb: 'POST',
			response: res.statusCode
		};
		if (res.statusCode === 202) {
			logger.debug('Bucket set', logger.getContext(context));
			deferred.resolve(auth);
		} else {
			//TODO: throw an error or reject promise or maybe a retry ?
			logger.warning('Bucket not set', logger.getContext(context));
			deferred.reject(auth);
		}

	}).end();

	return deferred.promise;
}

/**
 * @param {string} name Bucket name
 * @returns {function} that returns a promise
 */
function createBucket(name) {
	return function (auth) {
		var deferred = Q.defer(),
			uri = url.parse(auth.url);

		http.request(createRequestObject(
			uri.path + '/' + name,
			'PUT',
			{
				'Content-Length': 0,
				'X-Auth-Token': auth.token,
				'X-Container-Read': '.r:*',
				'X-Container-Write': config.swift.swiftUser
			}
		), function (res) {
			logger.info('Creating a bucket:' + res.statusCode);

			if (res.statusCode === 201) {
				logger.info('Done');

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

/**
 * @returns {defer.promise}
 */
function getToken() {
	var deferred = Q.defer(),
		uri = url.parse(config.swift.swiftAuthUrl);

	logger.debug('Fetching token');

	http.get(createRequestObject(
		uri.path,
		'GET',
		{
			'X-Auth-User': config.swift.swiftUser,
			'X-Auth-Key': config.swift.swiftKey
		}
	), function (res) {
		if (res.statusCode === 204) {
			var headers = res.headers,
				auth = {
					url: headers['x-storage-url'],
					token: headers['x-auth-token']
				},
				context = {
					job: 'tiling',
					action: 'obtaining token',
					response: res.statusCode,
					headers: res.headers,
					auth: auth
				};

			logger.debug('Token received', logger.getContext(context));

			deferred.resolve(auth);
		} else {
			deferred.reject({
				message: 'Most probably wrong key'
			});
		}
	}).on('error', function (err) {
		logger.error(err);
	});

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
			logger.error(err);

			deferred.reject(err);
		})
		.done();

	return deferred.promise;
};
