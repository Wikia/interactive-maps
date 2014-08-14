#!/usr/bin/env node
'use strict';

/**
 * This is part of MWEB-869
 *
 * The script loops through all tile sets with status OK,
 * calculates their background color by using lib/imageBackground.js
 * and updates the field in tile_set table in DB
 */

var dbCon = require('../lib/db_connector'),
	config = require('../lib/config'),
	utils = require('../lib/utils'),
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

			data.forEach(function (row) {
				imageBackground.getBgColorForImage({
					id: row.id,
					image: row.image,
					dir: tmpDir
				})
				.then(function (data) {
					found--;
					return updateBackgroundColor(data, conn);
				}).then(function () {
					if (found === 1) {
						process.exit();
					}
				})
				.catch(function (err) {
					found--;
					console.log(err);
					if (found === 0) {
						process.exit();
					}
				});
			});
		});
	})
	.catch(function (err) {
		console.log(err);
	});
