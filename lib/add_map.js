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
	sys = require('sys'),
	os = require('os'),
	Q = require('q'),
	fs = require('fs'),
	path = require('path'),
	dbCon = require('./db_connector'),
	sizeOf = require('image-size'),
	kue = require('kue'),

	// local modules
	fetchImage = require('./fetchImage'),
	generateTiles = require('./generateTiles'),
	optimizeTiles = require('./optimizeTiles'),
	uploadTiles = require('./uploadTiles'),
	cleanupTiles = require('./cleanupTiles'),

	dbTable = 'map',

	// create queue
	jobs = kue.createQueue(config),

	// set temp folders
	tmpDir = os.tmpdir() + 'int_map/',
	mapsDir = tmpDir + 'maps/';

//setup folders
if (!fs.existsSync(tmpDir)) {
	fs.mkdirSync(tmpDir);
}

if (!fs.existsSync(mapsDir)) {
	fs.mkdirSync(mapsDir);
}

// init queue
kue.app.set('title', config.kue.title);
kue.app.listen(config.kue.port);

console.log('Kue is listening on port', config.kue.port);

// queue job process for creating tiles from image
jobs.process('tiling', config.kue.maxCutTilesJobs, function (job, done) {
	generateTiles(job.data)
		.then(optimizeTiles)
		.then(uploadTiles)
		.then(cleanupTiles)
		.then(insertMap)
		.catch(done)
		.done();
});

//queue job process for uploading image
jobs.process('process', config.kue.maxFetchJobs, function (job, done) {
	fetchImage(job.data)
		.then(setupTiling)
		.then(done);
});

function createJobDataGetter(image, dir, dimensions, data) {
	return function (minZoom, maxZoom, firstJob) {
		return {
			image: image,
			dir: dir,
			minZoom: minZoom,
			maxZoom: maxZoom || minZoom,
			width: dimensions.width,
			height: dimensions.height,
			user: data.user,
			name: data.name,
			firstJob: firstJob
		};
	}
}

/**
 * @desc Create tiling job for uploaded image
 * @param data {object} - object with data for setup tiling
 * @returns {object} - promise
 */

function setupTiling(data) {
	var deferred = Q.defer(),
		fullPath = data.dir + data.image,
		dimensions = sizeOf(fullPath),
		maxZoomLevel = getMaxZoomLevel(dimensions.width, dimensions.height),
		dir = tempName('TILES_', data.image),
		firstMaxZoomLevel = Math.min(config.minZoom + config.firstBatchZoomLevels, maxZoomLevel),
		jobData = createJobDataGetter(fullPath, dir, dimensions, data),
		job;

	console.log('Original size:', dimensions.width, dimensions.height);
	console.log('Max zoom level:', maxZoomLevel);
	console.log('First batch levels:', config.minZoom, firstMaxZoomLevel);

	// create tiling job for initial zoom levels with high priority
	job = jobs.create('tiling', jobData(config.minZoom, firstMaxZoomLevel, true))
		.priority('high')
		.save();

	// create tiling jobs for higher zoom levels with low priority not to block tiling processing for new uploaded maps
	for (var i = firstMaxZoomLevel + 1; i <= maxZoomLevel; i++) {
		jobs.create('tiling', jobData(i))
			.priority('low')
			.save();
	}

	deferred.resolve();

	return deferred.promise;
}

/**
 * @desc returns max zoom level based on image dimensions
 * @param width {number} - image width
 * @param height {number} - image height
 * @returns {number} - max zoom level
 */

function getMaxZoomLevel(width, height) {
	var size = Math.max(width, height);

	return Math.min(~~Math.log(size, 2), config.maxZoom);
}

/**
 * @desc returns temporary directory name based on given params
 * @param prefix {string} - prefix added to dir name
 * @param fileName {string} - name of the file
 * @returns {string} - temporary directory name
 */

function tempName(prefix, fileName) {
	return mapsDir + prefix + fileName; //+ '_' + (+new Date()) ;
}

/**
 * @desc Query DB with map CREATE and UPDATE
 * @param data {object} - object with data to send to DB
 * @returns {object} - promise
 */

function insertMap(data) {
	console.log(data);
	var deferred = Q.defer(),
		object,
		query,
		where;

	// and new map to DB with initial zoom levels
	if (data.firstJob) {
		// object mapped to db columns for creating map
		// TODO: if data properties would be mapped to db columns we could avoid this step
		object = {
			name: data.name,
			type: 'custom',
			width: data.width,
			height: data.height,
			min_zoom: data.minZoom,
			max_zoom: data.maxZoom,
			created_by: data.user
		};

		//TODO Create instance of a map
		//TODO Notify user that map is ready to be edited
		console.log('Saving:', [data.name, data.type || 'custom', data.width, data.height, data.minZoom, data.maxZoom, data.user]);

		query = dbCon.insert(dbTable, object);

		query.then(function (result) {
			console.log('Saved:', data.name);

			deferred.resolve({
				id: result
			});
		}, function (err) {
			deferred.reject(err);
		});

	}
	// update map in DB with higher zoom levels
	else {
		// object mapped to db columns for updating map
		// TODO: if data properties would be mapped to db columns we could avoid this step
		object = {
			max_zoom: data.maxZoom
		};
		// update map of given name
		where = {
			name: data.name
		};

		// update map in DB with higher zoom levels
		console.log('Updating:', [data.name, data.maxZoom]);

		query = dbCon.update(dbTable, object, where);

		query.then(function (result) {
			console.log('Updated:', data.name);
			deferred.resolve();
		}, function (err) {
			deferred.reject(err);
		});
	}

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
		dir: mapsDir,
		user: data.created_by,
		dbTable: dbTable
	})
		.priority('high')
		.save();

	deferred.resolve();

	return deferred.promise;
};
