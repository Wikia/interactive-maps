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
	logger = require('./logger'),
	dbTable = 'tile_set',
	tmpDir = config.tmp,
	url = require('url'),
	fs = require('fs'),
	context;

function removeFailedMap(id) {
	dbCon.destroy(dbTable, {
		id: id
	})
		.then(function () {
			context = {
				job: 'db',
				action: 'removing failed map',
				id: id
			};
			logger.info('Deleted map with id: ' + id, logger.getContext(context));
		});
}

// queue job process for creating tiles from image
jobs.process('tiling', config.kue.maxCutTilesJobs, function (job, done) {
	logger.debug('job tiling starts ' + job.data.name);

	generateTiles(job)
		.then(optimizeTiles)
		.then(uploadTiles)
		.then(cleanupTiles)
		.then(updateMap)
		.then(function () {
			logger.debug('Tiling process finished');

			done();
		})
		.catch (function (error) {
			context = {
				job: 'tiling',
				error: error
			};
			logger.error(error, logger.getContext(context));

			done({
				message: 'generating tiles failed'
			});
		})
		.done();
});

jobs.process('process', config.kue.maxFetchJobs, function (job, done) {

	job.data.dir = tmpDir;

	fetchImage(job.data)
		.then(setupTiling)
		.then(function () {
			done();
		})
		.catch (function (error) {
			context = {
				job: 'fetching image',
				error: error
			};
			logger.error(error, logger.getContext(context));

			done({
				message: 'Fetching a file failed'
			});
		})
		.done();
});

jobs.process('process_marker', config.kue.maxProcessMarkerJobs, function (job, done) {

	job.data.dir = tmpDir;
	job.data.name = 'markers_' + job.data.map_id;

	fetchImage(job.data)
		.then(clearMarker)
		.then(updateMarkerStatus)
		.then(function () {
			done();
		})
		.catch (function (err) {
		context = {
			job: 'process_marker',
			error: err
		};
		logger.error(err, logger.getContext(context));

		done({
			message: 'Processing marker failed'
		});
	})
	.done();
});


function clearMarker(data) {
	var deferred = Q.defer(),
		fileName = url.parse(data.fileUrl).pathname.split('/').pop(),
		file = fs.createWriteStream(data.dir + fileName);

	fs.unlink(file, function(err) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve();
		}
	});

	return deferred.promise;
}

function updateMarkerStatus(data) {
	var deferred = Q.defer();

	dbCon.update(
		data.dbTable,
		{
			status: utils.poiCategoryStatus.dfs,
			marker: data.image
		},
		{
			id: data.id
		}
	).then(
		function (){
			deferred.resolve(data);
		},
		function (err){
			deferred.reject(err);
		}
	);

	return deferred.promise;
}

/**
 *
 * @param {String} image image file name
 * @param {String} dir directory that the file is sored in
 * @param {Object} dimensions dimensions of an image
 * @param {Object} data Additional info about a map
 * @returns {Function} Function that returns object that represents a given job
 */
function createJobDataGetter(image, dir, dimensions, data) {
	return function (minZoom, maxZoom) {
		return {
			image: image,
			dir: dir,
			minZoom: minZoom,
			maxZoom: maxZoom || minZoom,
			width: dimensions.width,
			height: dimensions.height,
			user: data.user,
			name: data.name,
			mapId: data.mapId,
			status: {
				tiled: false,
				optimized: false,
				uploaded: false,
				removed: false
			}
		};
	};
}

/**
 * Function that adds a tiling job to a queue
 *
 * @param data job data
 * @param priority
 * @param attempts number of attempts for a job
 * @param delay
 */
function createJob(data, priority, attempts, delay) {
	jobs.create('tiling', data)
		.priority(priority)
		.attempts(attempts)
		.delay(delay || 0)
		.save()
		.on('complete', function () {
			logger.debug('Job tiling complete');
		}).on('failed', function () {
			logger.error('Job tiling failed');

			removeFailedMap(data.mapId);
		}).on('failed attempt', function () {
			logger.warning('Job tiling failed but will retry');
		});
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
		i = firstMaxZoomLevel + 1,
		attempts = config.kue.cutTilesAttempts || 1,
		context = {
			job: 'tiling',
			action: 'setup',
			fullPath: fullPath,
			dimensions: dimensions,
			maxZoomLevel: maxZoomLevel
		};

	logger.info('Creating tiling job', logger.getContext(context));
	logger.info('Original size: ' + dimensions.width + ' x ' + dimensions.height);
	logger.info('Max zoom level: ' + maxZoomLevel);
	logger.info('First batch levels: ' + config.minZoom + ' ' + firstMaxZoomLevel);

	// create tiling job for initial zoom levels with high priority
	createJob(jobData(config.minZoom, firstMaxZoomLevel, true), 'medium', attempts);

	// create tiling jobs for higher zoom levels with low priority not to block tiling processing for new uploaded maps
	for (; i <= maxZoomLevel; i++) {
		createJob(jobData(i), 'low', attempts, 5000);
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
 * @param job job object that is currently being processed
 * @returns {Q.promise}
 */
function updateMap(job) {
	var data = job.data,
		deferred = Q.defer(),
		where = {
			id: data.mapId
		},
		object = {
			max_zoom: dbCon.knex.raw('`max_zoom` + ' + utils.zoomLevelsToBin(data.minZoom, data.maxZoom))
		},
		context = {
			job: 'db',
			action: 'updating Map',
			object: object,
			id: data.mapId
		};

	//update width and height only on min level
	if (data.minZoom === config.minZoom) {
		object.width = data.width;
		object.height = data.height;
	}

	// update map in DB with higher zoom levels
	logger.info('Updating: ' + data.mapId + ' ' + data.name + ' ' + data.maxZoom);

	dbCon.update(dbTable, object, where)
		.then(function () {
			logger.info('Updated: ' + data.name + ' ' + data.mapId, logger.getContext(context));
			deferred.resolve();
		})
		.catch (function (err) {
			context.error = err;
			logger.error(err, logger.getContext(context));
			deferred.reject(err);
		});

	return deferred.promise;
}
