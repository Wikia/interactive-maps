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

// third party modules
var config = require('./config'),
	Q = require('q'),
	dbCon = require('./db_connector'),
	kue = require('kue'),
	jobs = kue.createQueue(config),
	logger = require('./logger');


/**
 *
 * @param dbTable data table to insert into
 * @param data data about a map
 * @returns {Object} promise
 */
function addToDB(dbTable, data) {
	// object mapped to db columns for creating map
	// TODO: if data properties would be mapped to db columns we could avoid this step
	var object = {
		name: data.name,
		type: 'custom',
		url: data.url,
		width: 0,
		height: 0,
		min_zoom: 0,
		max_zoom: 0,
		created_on: data.created_on,
		created_by: data.created_by
	};

	return dbCon.insert(dbTable, object);
}

/**
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
 *
 * @param dbTable database table
 * @param data data about a map
 * @param id id of a map
 */
function setupProcessJob(dbTable, data, id) {
	//TODO: what if someone adds same map at the same time ? :)
	//TODO: handle situation when zoom 6 comes before 0-5
	//TODO: improve recovering from restart so we can redo only needed parts of a job
	jobs.create('process', {
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

			//removeFailedMap(job.data.mapId);

		}).on('failed attempt', function () {
			logger.warning('Job process failed but will retry ' + data.url + ' ' + data.name);
		});
}

/**
 * @desc Public entry point for creating custom map
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
			deferred.resolve(result[0].id);
		} else {
			//Save 'stub' to DB so we have map id
			addToDB(dbTable, data)
				.then(function (result) {

					logger.info('Saved: ' + data.url + ' ' + result);

					setupProcessJob(dbTable, data, result[0]);

					deferred.resolve(result);
				}).catch (function (err) {
					logger.error(err);
				});
		}
	});

	return deferred.promise;
};

function shutdown(){
	jobs.shutdown(function () {
		logger.info('Kue is shut down');

		process.exit(0);
	}, 5000);
}

function onDie() {
	//when terminating: mark all active jobs as inactive
	//so kue can pick them up after restart
	jobs.active(function (err, ids) {
		var length = ids.length,
			count = 0,
			i = 0;

		if (length) {
			for (; i < length; i++) {
				kue.Job.get(ids[i], function (err, job) {
					job.inactive().save();
					count++;

					if (count === length) {
						shutdown();
					}
				});
			}
		} else {
			shutdown();
		}
	});
}

process.on('SIGINT', onDie);
process.on('SIGTERM', onDie);
