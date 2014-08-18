#!/usr/bin/env node
'use strict';

/**
 * This is part of MWEB-869
 *
 * The script gets first tiles' set with status OK and background-color set to #ddd,
 * calculates its background color by using lib/imageBackground.js
 * and updates the field in tile_set table in DB.
 */

var dbCon = require('../lib/db_connector'),
	config = require('../lib/config'),
	utils = require('../lib/utils'),
	fetchImage = require('../lib/fetchImage'),
	imageBackground = require('../lib/imageBackground'),
	tmpDir = config.tmp,
	tableName = 'tile_set';

/**
 * @desc Updates a tiles' set row in database
 * @param {object} data
 * @param {object} conn
 * @returns {object}
 */
function updateBackgroundColor(data, conn) {
	console.log('Updating background color for tiles\' set with id #' + data.id + '...');
	console.log('Setting its color to: ' + data.bgColor + '...');

	// there are some race condition we solved partially
	// by creating next() function, however some anomalies
	// still happens and this simple condition is a workaround
	//
	// if we're going to use this script more than once
	// we'll have to trace down the issue and then remove
	// this workaround
	if (data.bgColor.substring(0,4) !== 'rgba') {
		data.bgColor = '#ddd';
	}

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
			console.log('Done.');
			process.exit();
		})
		.catch(function (err) {
			console.log(err);
			console.log(data);
			process.exit();
		});
}

/**
 * Main part of the script
 */
dbCon.getConnection(dbCon.connType.master)
	.then(function (conn) {
		dbCon.knex(tableName)
			.column([
				'id',
				'image'
			])
			.where({
				'status': utils.tileSetStatus.ok,
				'background_color': '#ddd'
			})
			.limit(1)
			.connection(conn)
			.select()
			.then(function (data) {
				if (data.length > 0) {
					console.log('Found a tile\'s set: # ' + data[0].id + '...');
					updateTileset(data.pop(), conn);
				} else {
					console.log('No tiles sets with out-dated background color found.');
					process.exit();
				}
			});
	})
	.catch(function (err) {
		console.log(err);
	});
