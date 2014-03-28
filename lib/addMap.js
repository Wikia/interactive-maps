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
		object,
		query;

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

	//TODO Create instance of a map
	//TODO Notify user that map is ready to be edited
	console.log('Saving:', [data.name, data.type || 'custom', data.width, data.height, data.minZoom, data.maxZoom, data.user]);

	query = dbCon.insert(dbTable, object);

	query.then(function (result) {
		console.log('Saved:', data.name);

		deferred.resolve(result);
	}, function (err) {
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

	jobs.create('process', {
		fileUrl: data.url,
		name: data.name,
		user: data.created_by,
		dbTable: dbTable
	})
		.priority('high')
		.save();

	addToDB('map', data)
		.then(deferred.resolve);

	return deferred.promise;
};
