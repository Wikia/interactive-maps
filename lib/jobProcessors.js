'use strict';

var dbCon = require('./db_connector'),
	sizeOf = require('image-size'),
	utils = require('./utils'),
	config = require('./config'),
	Q = require('q'),
	fetchImage = require('./fetchImage'),
	generateTiles = require('./generateTiles'),
	optimizeTiles = require('./optimizeTiles'),
	uploadTiles = require('./uploadTiles'),
	cleanupTiles = require('./cleanupTiles'),
	jobs = require('kue').createQueue(config),
	dbTable = 'map',
	tmpDir = config.tmp;

function removeFailedMap(id){
	dbCon.destroy(dbTable, {id: id})
		.then(function() {
			console.log('Deleted map with id:', id);
		});
}

// queue job process for creating tiles from image
jobs.process('tiling', config.kue.maxCutTilesJobs, function (job, done) {
	generateTiles(job.data)
		.then(optimizeTiles)
		.then(uploadTiles)
		.then(cleanupTiles)
		.then(updateMap)
		.then(done)
		.catch(function (error) {
			console.log(error);

			removeFailedMap(job.data.mapId);
			done();
		})
		.done();
});

jobs.process('process', config.kue.maxFetchJobs, function (job, done) {

	job.data.dir = tmpDir;

	fetchImage(job.data)
		.then(setupTiling)
		.catch(function(error){
			console.log(error);

			removeFailedMap(job.data.mapId);
			done();
		})
		.done();

	done();
});

/**
 *
 * @param {String} image image file name
 * @param {String} dir directory that the file is sored in
 * @param {Object} dimensions dimensions of an image
 * @param {Object} data Additional info about a map
 * @returns {Function} Function that returns object that represents a given job
 */
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
			mapId: data.mapId
		};
	};
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
		maxZoomLevel = utils.getMaxZoomLevel(dimensions.width, dimensions.height, config.maxZoom),
		dir = tempName('TILES_', data.image),
		firstMaxZoomLevel = Math.min(config.minZoom + config.firstBatchZoomLevels, maxZoomLevel),
		jobData = createJobDataGetter(fullPath, dir, dimensions, data),
		i = firstMaxZoomLevel + 1;

	console.log('Original size:', dimensions.width, dimensions.height);
	console.log('Max zoom level:', maxZoomLevel);
	console.log('First batch levels:', config.minZoom, firstMaxZoomLevel);

	// create tiling job for initial zoom levels with high priority
	jobs.create('tiling', jobData(config.minZoom, firstMaxZoomLevel, true))
		.priority('high')
		.save();

	// create tiling jobs for higher zoom levels with low priority not to block tiling processing for new uploaded maps
	for (; i <= maxZoomLevel; i++) {
		jobs.create('tiling', jobData(i))
			.priority('low')
			.save();
	}

	deferred.resolve();

	return deferred.promise;
}

/**
 * @desc returns temporary directory name based on given params
 * @param prefix {string} - prefix added to dir name
 * @param fileName {string} - name of the file
 * @returns {string} - temporary directory name
 */

function tempName(prefix, fileName) {
	return tmpDir + prefix + fileName; //+ '_' + (+new Date());
}

/**
 * Function that adds a map to DB or update its status
 * Query DB with map CREATE and UPDATE
 *
 * @param data object with data to send to DB
 * @returns {Q.promise}
 */
function updateMap(data) {
	var deferred = Q.defer(),
		object,
		where;

	// object mapped to db columns for updating map
	// TODO: if data properties would be mapped to db columns we could avoid this step
	object = {
		max_zoom: data.maxZoom,
		width: data.width,
		height: data.height
	};
	// update map of given name
	where = {
		id: data.mapId
	};

	// update map in DB with higher zoom levels
	console.log('Updating:', [data.mapId, data.name, data.maxZoom]);

	dbCon.update(dbTable, object, where)
		.then(function (result) {
			console.log('Updated:', data.name, data.mapId);
			deferred.resolve();
		})
		.catch(function (err) {
			deferred.reject(err);
		});

	return deferred.promise;
}
