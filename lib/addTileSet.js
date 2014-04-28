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
 * @param dbTable data table to insert into
 * @param data data about a map
 * @returns {Object} promise
 */
function addToDB(dbTable, data) {
	// TODO: if data properties would be mapped to db columns we could avoid this step
	var mapObject = {
		name: data.name,
		type: 'custom',
		url: data.url,
		image: url.parse(data.url).pathname.split('/').pop(),
		width: 0,
		height: 0,
		min_zoom: config.minZoom,
		max_zoom: 0,
		created_on: data.created_on,
		created_by: data.created_by
	};

	return dbCon.insert(dbTable, mapObject);
}

/**
 * @desc Checks if tile set with a given url exists in DB
 *
 * @param dbTable database table to select from
 * @param data data about a map
 * @returns {Object} promise
 */
function checkIfMapExists(dbTable, data) {
	return dbCon.select(dbTable, 'id', {
		url: data.url
	});
}

/**
 * @desc Updates the tile set in the database as
 *
 * @param {string} dbTable
 * @param {string} id of a map
 * @param {number} status to set for the map
 */
function updateMapStatus(dbTable, id, status) {
	dbCon.update(dbTable, {
		id: id
	}, {
		status: status
	}).then(function () {
		logger.info('Updated tile set status with id: ' + id + ', to ' + status);
	});
}

/**
 * @desc setup a job for fetching an image
 *
 * @param dbTable database table
 * @param data data about a map
 * @param id id of a map
 */
function setupProcessJob(dbTable, data, id) {
	//TODO: handle situation when zoom 6 comes before 0-5
	var job = jobs.create('process', {
		fileUrl: data.url,
		name: data.name,
		user: data.created_by,
		dbTable: dbTable,
		mapId: id
	})
		.priority('high')
		.attempts(config.kue.fetchJobsAttempts || 1)
		.save()
		.on('complete', function () {
			logger.debug('Job process complete ' + data.url + ' ' + data.name);
		}).on('failed', function () {
			logger.error('Job process failed ' + data.url + ' ' + data.name);

			updateMapStatus(dbTable, job.data.mapId, utils.tileSetStatus.failed);

		}).on('failed attempt', function () {
			logger.warning('Job process failed but will retry ' + data.url + ' ' + data.name);
		});
}

/**
 * @desc Public entry point for creating tile set
 *
 * @param dbTable {string} - db table name
 * @param data {object} - object with map data
 * @returns {object} - promise
 */
module.exports = function process(dbTable, data) {
	var deferred = Q.defer(),
		context = {
			job: 'db',
			action: 'saving stub'
		};

	checkIfMapExists(dbTable, data).then(function (result) {
		if (result.length) {
			logger.info('Tile set created from image with this URL already exist under id: ' + result[0].id);

			deferred.resolve(result[0].id);
		} else {
			//Save 'stub' to DB so we have map id
			addToDB(dbTable, data)
				.then(function (result) {

					logger.info('Saved: ' + data.url + ' ' + result);

					setupProcessJob(dbTable, data, result[0]);

					deferred.resolve(result);
				}).
			catch (function (err) {
				logger.error(err);
				deferred.reject({
					clientError: 500
				});
			});
		}
	}).
	catch (function (err) {
		logger.error(err);
		deferred.reject({
			clientError: 500
		});
	});

	return deferred.promise;
};
