#!/usr/bin/env node
'use strict';

var http = require('http'),
	url = require('url'),
	dbCon = require('../lib/db_connector'),
	config = require('../lib/config'),
	utils = require('../lib/utils');

/**
 * Increase the HTTP pool size because the default 5 makes the process too slow
 * @type {number}
 */
http.globalAgent.maxSockets = 10;

/**
 * @desc Check if tile set image exists
 *
 * @param {number} tileSetId
 * @param {string} imageName
 */
function checkImage(tileSetId, imageName) {
	var imageUrl = utils.imageUrl(
			config.dfsHost,
			utils.getBucketName(
				config.bucketPrefix + config.tileSetPrefix,
				tileSetId
			),
			imageName
		),
		urlSegments = url.parse(imageUrl),
		request = http.request({
			host: urlSegments.host,
			port: 80,
			path: urlSegments.path,
			method: 'HEAD'
		}, function (response) {
			if (response.statusCode  !== 200) {
				console.log('\nTile Set id: ' + imageName + ' returned code: ' +
					response.statusCode + ' for image: ' + imageUrl);
			} else {
				process.stdout.write('.');
			}
		});

	request.on('error', function (err) {
		console.log('ERROR: ',err);
	});
	request.end();
}

dbCon.getConnection(dbCon.slave, function (conn) {
	dbCon.select(conn, 'tile_set', [
		'id',
		'image'
	], {
		'status': utils.tileSetStatus.ok
	}).then(function (data) {
		data.forEach(function (row) {
			checkImage(row.id, row.image);
		});
	});
});
