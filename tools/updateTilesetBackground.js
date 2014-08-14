#!/usr/bin/env node
'use strict';

/**
 * This is part of MWEB-869
 *
 * The script loops through all tile sets with status OK,
 * calculates their background color by using lib/imageBackground.js
 * and updates the field in tile_set table in DB.
 *
 * We did have to make it sequential because of race conditions
 * among modules (fetchImage, imageBackground).
 */

var dbCon = require('../lib/db_connector'),
	config = require('../lib/config'),
	utils = require('../lib/utils'),
	fetchImage = require('../lib/fetchImage'),
	imageBackground = require('../lib/imageBackground'),
	tmpDir = config.tmp,
	tableName = 'tile_set',
	tileSets = [];

/**
 * @desc Updates a tiles' set row in database
 * @param {object} data
 * @param {object} conn
 * @returns {object}
 */
function updateBackgroundColor(data, conn) {
	console.log('Updating background color for tiles\' set with id #' + data.id + '...');
	console.log('Setting its color to: ' + data.bgColor + '...');

	return dbCon.update(
		conn,
		tableName,
		{
			background_color: data.bgColor
		},
		{
			id: data.id
		}
	);
}

/**
 * @desc Helper function to call sequentially next tiles' set update
 * @param {object} conn connection object created by db_connector.getConnection()
 */
function next(conn) {
	if (tileSets.length > 0) {
		updateTileset(tileSets.pop(), conn);
	} else {
		console.log('Done.');
		process.exit();
	}
}

/**
 * @desc Downloads the image, calculates bg color, updates DB and calls itself with different tileset's data
 * @param {object} row object with data from database
 * @param {object} conn connection object created by db_connector.getConnection()
 */
function updateTileset(row, conn) {
	var tileSetId = row.id,
		imageName = row.image,
		bucketName = utils.getBucketName(
			config.bucketPrefix + config.tileSetPrefix,
			tileSetId
		),
		imageUrl = utils.imageUrl(
			config.dfsHost,
			bucketName,
			imageName
		),
		data = {
			id: tileSetId,
			image: imageName,
			fileUrl: imageUrl,
			bucketName: bucketName,
			dir: tmpDir
		};

	fetchImage(data)
		.then(imageBackground.getBgColorForImage)
		.then(function (data) {
			return updateBackgroundColor(data, conn);
		})
		.then(function () {
			next(conn);
		})
		.catch(function (err) {
			console.log(err);
			next(conn);
		});
}

/**
 * Main part of the script
 */
dbCon.getConnection(dbCon.connType.master)
	.then(function (conn) {
		dbCon.select(conn, tableName, [
			'id',
			'image'
		], {
			'status': utils.tileSetStatus.ok,
			'background_color': '#ddd'
		}).then(function (data) {
			var found = data.length;
			console.log('Found ' + found + ' tiles\' sets...');
			tileSets = data;
			next(conn);
		});
	})
	.catch(function (err) {
		console.log(err);
	});
