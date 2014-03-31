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
	jobs = require('kue').createQueue(config);

function addToDB(dbTable, data){
	var deferred = Q.defer(),
		object;

	// object mapped to db columns for creating map
	// TODO: if data properties would be mapped to db columns we could avoid this step
	object = {
		name: data.name,
		type: 'custom',
		width: 0,
		height: 0,
		min_zoom: 0,
		max_zoom: 0,
		created_by: data.created_by
	};

	console.log('Saving:', [object.name, object.type || 'custom', object.created_by]);

	dbCon.insert(dbTable, object)
		.then(function (result) {
			console.log('Saved:', object.name, result);

			deferred.resolve(result);
		}).catch(function (err) {
			deferred.reject(err);
		});

	return deferred.promise;
}

// Public API

/**
 * @desc Public entry point for creating custom map
 * @param dbTable {string} - db table name
 * @param data {object} - object with map data
 * @returns {object} - promise
 */
module.exports = function process(dbTable, data) {
	var deferred = Q.defer();

	//Save 'stub' to DB so we have map id
	addToDB('map', data)
		.then(function(result){

			jobs.create('process', {
				fileUrl: data.url,
				name: data.name,
				user: data.created_by,
				dbTable: dbTable,
				mapId: result[0]
			})
				.priority('high')
				.save();

			deferred.resolve(result);
		});

	return deferred.promise;
};
