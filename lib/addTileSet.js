/**
 * Module that takes care of:
 * - uploading a file to temp dir
 * - creating all necessary queue tasks to generate all necessary tiles
 * - updating database
 * - sending tiles to DFS
 *
 * Downloading and cutting first 0-4 zoom levels has highest priority
 * so users don't have to wait long for next steps of creating maps
 */

'use strict';

var config = require('./config'),
	Q = require('q'),
	url = require('url'),
	dbCon = require('./db_connector'),
	kue = require('kue'),
	jobs = kue.createQueue(config),
	logger = require('./logger'),
	utils = require('./utils');

/**
 * @desc Adds a 'placeholder' to DB
 *
 * @param {object} conn Database connection
 * @param {string} dbTable data table to insert into
 * @param {object} data data about a tile set
 * @returns {object} promise
 */
function addToDB(conn, dbTable, data) {
	// TODO: if data properties would be mapped to db columns we could avoid this step
	var tileSetObject = {
		name: data.name,
		type: 'custom',
		url: data.url,
		image: utils.getFileNameFromPathName(url.parse(data.url).pathname),
		width: 0,
		height: 0,
		min_zoom: config.minZoom,
		max_zoom: 0,
		status: utils.tileSetStatus.processing,
		created_on: data.created_on,
		created_by: data.created_by
	};

	return dbCon.insert(conn, dbTable, tileSetObject);
}

/**
 * @desc Checks if tile set with a given url exists in DB
 *
 * @param {object} conn Database connection
 * @param {string} dbTable database table to select from
 * @param {object} data data about a tile set
 * @returns {object} promise
 */
function checkIfTileSetExists(conn, dbTable, data) {
	return dbCon.select(conn, dbTable, 'id', {
		url: data.url
	});
}

/**
 * @desc Updates the tile set in the database as
 *
 * @param {object} conn Database connection
 * @param {string} dbTable
 * @param {string} id of a tile set
 * @param {number} status to set for the tile set
 */
function updateTileSetStatus(conn, dbTable, id, status) {
	dbCon.update(conn, dbTable, {
		status: status
	}, {
		id: id
	}).then(function () {
		logger.info('Updated tile set status with id: ' + id + ', to ' + status);
	});
}

/**
 * @desc setup a job for fetching an image
 *
 * @param {object} conn - Database connection
 * @param {string} dbTable - database table
 * @param {object} data - data about a tile set
 * @param {number} id - id of a tile set
 */
function setupProcessJob(conn, dbTable, data, id) {
	//TODO: handle situation when zoom 6 comes before 0-5
	var job = jobs.create('process', {
			fileUrl: data.url,
			name: data.name,
			user: data.created_by,
			dbTable: dbTable,
			tileSetId: id
		})
		.priority('high')
		.attempts(config.kue.fetchJobsAttempts || 1)
		.save()
		.on('complete', function () {
			logger.debug('Job process complete ' + data.url + ' ' + data.name);
		}).on('failed', function () {
			logger.error('Job process failed ' + data.url + ' ' + data.name);

			updateTileSetStatus(conn, dbTable, job.data.tileSetId, utils.tileSetStatus.failed);

		}).on('failed attempt', function () {
			logger.warning('Job process failed but will retry ' + data.url + ' ' + data.name);
		});
}

/**
 * Inserts name field into the MyISAM table for searching
 *
 * @param {object} conn Database connection
 * @param {string} dbTable
 * @param {number} tileSetId
 * @param {string} tileSetName
 * @returns {object} promise
 */
function insertSearchData(conn, dbTable, tileSetId, tileSetName) {
	return dbCon.insert(
		conn,
		dbTable + '_search',
		{
			id: tileSetId,
			name: tileSetName
		}
	).catch(function (err) {
		logger.error(err);
	});
}

/**
 * @desc Public entry point for creating tile set
 *
 * @param {object} conn - Database connection
 * @param {string} dbTable - db table name
 * @param {object} data  - object with tile set data
 * @returns {object} - promise
 */
module.exports = function process(conn, dbTable, data) {
	var deferred = Q.defer(),
		context = {
			job: 'db',
			action: 'saving stub'
		};

	checkIfTileSetExists(conn, dbTable, data).then(function (result) {
		if (result.length) {
			logger.info('Tile set created from image with this URL already exist under id: ' + result[0].id);

			deferred.resolve({
				exists: true,
				id: result[0].id
			});
		} else {
			//Save 'stub' to DB so we have tile set id
			addToDB(conn, dbTable, data)
				.then(function (result) {
					var tileSetId = result[0];

					logger.info('Saved: ' + data.url + ' ' + tileSetId, context);

					setupProcessJob(conn, dbTable, data, tileSetId);
					insertSearchData(conn, dbTable, tileSetId, data.name);

					deferred.resolve({
						exists: false,
						id: tileSetId
					});
				}).catch(function (err) {
					logger.error(err, context);
					deferred.reject(err);
				});
		}
	}).catch(function (err) {
		logger.error(err, context);
		deferred.reject({
			clientError: 500
		});
	});

	return deferred.promise;
};
