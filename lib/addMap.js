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
	jobs = require('kue').createQueue(config),
	logger = require('./logger');

function addToDB(dbTable, data) {
	// object mapped to db columns for creating map
	// TODO: if data properties would be mapped to db columns we could avoid this step
	var object = {
		name: data.name,
		type: 'custom',
		width: 0,
		height: 0,
		min_zoom: 0,
		max_zoom: 0,
		created_by: data.created_by
	};

	return dbCon.insert(dbTable, object);
}

// Public API

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

	//Save 'stub' to DB so we have map id
	addToDB(dbTable, data)
		.then(function (result) {
			context.result = result;
			logger.info('Saved: ' + result.name + ' ' + result, logger.getContext(context));

			//TODO: what if someone adds same map at the same time ? :)
			//TODO: handle situation when zoom 6 comes before 0-5
			//TODO: handle map name duplication
			//TODO: handle map url duplication ?
			jobs.create('process', {
				fileUrl: data.url,
				name: data.name,
				user: data.created_by,
				dbTable: dbTable,
				mapId: result[0]
			})
			.priority('high')
			.attempts(config.kue.fetchJobsAttempts || 1)
			.save()
			.on('complete', function(){
				logger.debug('Job process complete ' + data.url + ' ' + data.name);
			}).on('failed', function(){
				logger.error('Job process failed ' + data.url + ' ' + data.name);

				//removeFailedMap(job.data.mapId);

			}).on('failed attempt', function(){
				logger.warning('Job process failed but will retry ' + data.url + ' ' + data.name);
			});

			deferred.resolve(result);
		}).catch (function (err) {
			context.error = err;
			logger.error(err, logger.getContext(context));
		});

	return deferred.promise;
};
