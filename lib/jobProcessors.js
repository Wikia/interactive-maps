'use strict';

var dbCon = require('./db_connector'),
	sizeOf = require('image-size'),
	utils = require('./utils'),
	config = require('./config'),
	Q = require('q'),
	fetchImage = require('./fetchImage'),
	getBgColorForImage = require('./getBgColorForImage'),
	generateTiles = require('./generateTiles'),
	optimizeTiles = require('./optimizeTiles'),
	uploadTiles = require('./uploadTiles'),
	cleanupTiles = require('./cleanupTiles'),
	squidUpdate = require('./squidUpdate'),
	jobs = require('kue').createQueue(config),
	logger = require('./logger'),
	dbTable = 'tile_set',
	hostname = require('os').hostname(),
	tmpDir = config.tmp,
	url = require('url'),
	fs = require('fs'),
	context;

/**
 * @desc Updates the tile set data (status and background color) in the database
 * @param {string} dbTable
 * @param {string} id of a tile set
 * @param {number} status to set for the tile set
 * @param {string} color to set background color of a tile set
 */
function updateTileSetData(dbTable, id, status, color) {
	dbCon.getConnection(dbCon.connType.master, function (conn) {
		dbCon.update(conn, dbTable, {
			status: status,
			background_color: color
		}, {
			id: id
		}).then(function () {
			logger.info('Updated tile set status with id: ' + id + ', to ' + status);
			logger.info('Updated tile set background color with id: ' + id + ', to ' + color);
		});
	}, function (err) {
		logger.error('Error getting master connection: ', err);
	});
}

/**
 * @desc Create machine specific job name
 *
 * @param {string} name
 * @returns {string}
 */
function machineJobName(name) {
	return name + '_' + hostname;
}

/**
 * @desc Removes tile set with given id from DB
 * @param {number} id
 */
function removeFailedTileSet(id) {
	dbCon.getConnection(dbCon.connType.master, function (conn) {
		dbCon.destroy(
			conn,
			dbTable, {
				id: id
			}
		)
			.then(function () {
				context = {
					job: 'db',
					action: 'removing failed tile set',
					id: id
				};
				logger.info('Deleted tile set with id: ' + id, logger.getContext(context));
			});
	}, function (err) {
		logger.error('Database error: ' + err);
	});
}

/**
 * @desc returns temporary directory name based on given params
 * @param {string} prefix - prefix added to dir name
 * @param {string} fileName - name of the file
 * @returns {string} - temporary directory name
 */

function tempName(prefix, fileName) {
	return tmpDir + prefix + fileName; //+ '_' + (+new Date());
}

/**
 * Function that adds a tile set to DB or update its status
 * Query DB with tile set CREATE and UPDATE
 *
 * @param {object} job - job object that is currently being processed
 * @returns {Q.promise}
 */
function updateTileSet(job) {
	var data = job.data,
		deferred = Q.defer(),
		where = {
			id: data.tileSetId
		},
		object = {
			max_zoom: dbCon.knex.raw('`max_zoom` + ' + utils.zoomLevelsToBin(data.minZoom, data.maxZoom))
		},
		context = {
			job: 'db',
			action: 'updating tile set',
			max_zoom: utils.zoomLevelsToBin(data.minZoom, data.maxZoom),
			id: data.tileSetId
		};

	//update width and height only on min level
	if (data.minZoom === config.minZoom) {
		object.width = data.width;
		object.height = data.height;
	}

	// update tile set in DB with higher zoom levels
	logger.info('Updating: ' + data.tileSetId + ' ' + data.name + ' ' + data.maxZoom);
	dbCon.getConnection(dbCon.connType.master, function (conn) {
		dbCon.update(conn, dbTable, object, where)
			.then(function () {
				logger.info('Updated: ' + data.name + ' ' + data.tileSetId, logger.getContext(context));
				deferred.resolve();
			})
			.catch(function (err) {
				context.error = err;
				logger.error(err, logger.getContext(context));
				deferred.reject(err);
			});
	}, function (err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

/**
 * @desc Remove marker image from temp directory
 *
 * @param {object} data
 * @returns {object}
 */
function clearMarker(data) {
	var deferred = Q.defer(),
		fileName = data.dir + url.parse(data.fileUrl).pathname.split('/').pop();

	fs.unlink(fileName, function (err) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve(data);
		}
	});

	return deferred.promise;
}

/**
 * @desc Update marker state and image in the database
 *
 * @param {object} data
 * @returns {object}
 */
function updateMarkerStatus(data) {
	var deferred = Q.defer();
	dbCon.getConnection(dbCon.connType.master, function (conn) {
		dbCon.update(
			conn,
			data.dbTable, {
				status: utils.poiCategoryStatus.dfs,
				marker: data.image
			}, {
				id: data.poiCategoryId
			}
		).then(
			function () {
				deferred.resolve(data);
			},
			function (err) {
				deferred.reject(err);
			}
		);
	}, function (err) {
		deferred.reject(err);
	});

	return deferred.promise;
}

/**
 *
 * @param {String} image image file name
 * @param {String} dir directory that the file is sored in
 * @param {Object} dimensions dimensions of an image
 * @param {Object} data Additional info about a tile set
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
			tileSetId: data.tileSetId,
			bgColor: data.bgColor,
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
 * @param {object} data job data
 * @param {string} priority
 * @param {number} attempts number of attempts for a job
 * @param {number} delay
 */
function createJob(data, priority, attempts, delay) {
	jobs.create(machineJobName('tiling'), data)
		.priority(priority)
		.attempts(attempts)
		.delay(delay || 0)
		.save()
		.on('complete', function () {
			logger.debug('Job tiling complete');
			updateTileSetData(dbTable, data.tileSetId, utils.tileSetStatus.ok, data.bgColor);
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + data.mapId, 'tilesSetCreated');
		}).on('failed', function () {
			logger.error('Job tiling failed');
			removeFailedTileSet(data.tileSetId);
		}).on('failed attempt', function () {
			logger.warning('Job tiling failed but will retry');
		});
}

/**
 * @desc Create tiling job for uploaded image
 * @param {object} data - object with data for setup tiling
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
			maxZoomLevel: maxZoomLevel,
			bgColor: data.bgColor
		};

	logger.info('Creating tiling job', logger.getContext(context));
	logger.info('Original size: ' + dimensions.width + ' x ' + dimensions.height);
	logger.info('Max zoom level: ' + maxZoomLevel);
	logger.info('First batch levels: ' + config.minZoom + ' ' + firstMaxZoomLevel);

	// create tiling job for initial zoom levels with high priority
	createJob(jobData(config.minZoom, firstMaxZoomLevel, true), 'medium', attempts);

	// create tiling jobs for higher zoom levels with low priority not to block tiling processing for new uploaded files
	for (; i <= maxZoomLevel; i++) {
		createJob(jobData(i), 'low', attempts, 5000);
	}

	deferred.resolve();

	return deferred.promise;
}

// queue job process for creating tiles from image
jobs.process(machineJobName('tiling'), config.kue.maxCutTilesJobs, function (job, done) {
	logger.debug('job tiling starts ' + job.data.name);

	generateTiles(job)
		.then(optimizeTiles)
		.then(uploadTiles)
		.then(cleanupTiles)
		.then(updateTileSet)
		.then(function () {
			logger.debug('Tiling process finished');

			done();
		})
		.catch(function (error) {
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
	job.data.bucketName = utils.getBucketName(
		config.bucketPrefix + config.tileSetPrefix,
		job.data.tileSetId
	);

	fetchImage(job.data)
		.then(getBgColorForImage)
		.then(setupTiling)
		.then(function () {
			done();
		})
		.catch(function (error) {
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
	job.data.bucketName = utils.getMarkersBucketName(
		config.bucketPrefix + config.markersPrefix,
		job.data.mapId
	);

	fetchImage(job.data)
		.then(clearMarker)
		.then(updateMarkerStatus)
		.then(function () {
			done();
			squidUpdate.purgeKey(utils.surrogateKeyPrefix + job.data.mapId, 'markerUpdated');
		})
		.catch(function (err) {
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
