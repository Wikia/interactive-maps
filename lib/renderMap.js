'use strict';

var config = require('./config'),
	utils = require('./utils'),
	Q = require('q'),
	fs = require('fs'),
	logger = require('./logger'),
	dbConnector = require('./db_connector'),
	caching = require('./cachingUtils');

/**
 * @desc Load Map instance
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadMapInfo(mapId) {
	return dbConnector.knex('map')
		.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
		.column([
			'map.id',
			'map.title',
			'map.locked',
			'tile_set.name',
			'tile_set.type',
			'tile_set.url',
			'tile_set.width',
			'tile_set.height',
			'tile_set.min_zoom',
			'tile_set.max_zoom',
			'tile_set.status',
			'tile_set.attribution',
			'tile_set.subdomains'
		])
		.where('map.id', '=', mapId)
		.andWhere(function () {
			this.whereIn('tile_set.status', [utils.tileSetStatus.ok, utils.tileSetStatus.processing]);
		})
		.select();
}

/**
 * @desc Load Points for map instance
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadPoints(mapId) {
	return dbConnector.select(
		'poi', [
			'id',
			'name',
			'poi_category_id',
			'description',
			'link',
			'photo',
			'lat',
			'lon'
		], {
			map_id: mapId
		}
	);
}

/**
 * @desc Load point types
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadTypes(mapId) {
	return dbConnector.select(
		'poi_category', [
			'id',
			'parent_poi_category_id',
			'map_id',
			'name',
			'marker'
		], {
			'map_id': mapId
		}
	).then(
		function (collection) {
			utils.convertMarkersNamesToUrls(collection, config.dfsHost, config.bucketPrefix, config.markersPrefix);
			return collection;
		}
	);
}

/**
 * @desc Checks tile set status and rejects promise if needed
 * @param {object} mapData
 * @returns {object} - promise
 */
function checkTileSetStatus(mapData) {
	var deferred = Q.defer();

	if (mapData.length === 1) {
		mapData = mapData[0];
		if (mapData.status === utils.tileSetStatus.processing) {
			deferred.reject({
				code: 202,
				message: 'Map is still being processed.',
				originalImageUrl: mapData.url
			});
		} else {
			deferred.resolve(mapData);
		}
	} else {
		deferred.reject({
			code: 404,
			message: 'Map not found. An unicorn is weeping.'
		});
	}
	return deferred.promise;
}

/**
 * @desc Get points
 * @param {object} mapData
 * @returns {object} - promise
 */
function getPoints(mapData) {
	var deferred = Q.defer();

	loadPoints(mapData.id)
		.then(
			function (points) {
				mapData.points = points;
				deferred.resolve(mapData);
			},
			function (error) {
				deferred.reject({
					code: 500,
					message: error
				});
			}
	);
	return deferred.promise;
}

/**
 * @desc Gets points types for map instance
 * @param {object} mapData
 * @returns {object} - promise
 */
function getTypes(mapData) {
	var deferred = Q.defer();

	loadTypes(mapData.id).then(
		function (points) {
			mapData.types = points;

			deferred.resolve(mapData);
		},
		function (error) {
			deferred.reject({
				code: 500,
				message: error
			});
		}
	);

	return deferred.promise;
}

/**
 * @desc Generate path template for map
 * @param {string} mapName
 * @returns {string}
 */
function getPathTemplate(mapName) {
	return utils.imageUrl(
		config.dfsHost,
		utils.getBucketName(config.bucketPrefix, mapName),
		'{z}/{x}/{y}.png'
	);
}

/**
 * @desc Returns map's zoom level based on provided, max and min zoom levels
 * @param {number} zoom - user passed zoom level
 * @param {number} minZoom - minimum zoom level
 * @param {number} maxZoom - maximum zoom level
 * @returns {number} - zoom level
 */
function getZoomLevel(zoom, minZoom, maxZoom) {
	zoom = parseInt(zoom, 10) || Math.ceil((maxZoom - minZoom) / 2);
	return Math.max(Math.min(zoom, maxZoom), minZoom);
}

/**
 * @desc Returns map's set or default latitude
 * @param {number} latitude
 * @param {object} boundaries
 * @returns {number} Latitude
 */
function getLatitude(latitude, boundaries) {
	return parseFloat(latitude, 10) || Math.ceil((boundaries.north + boundaries.south) / 2);
}

/**
 * @desc Returns map's set or default longitude
 * @param {number} longitude
 * @param {object} boundaries
 * @returns {number} Longitude
 */
function getLongitude(longitude, boundaries) {
	return parseFloat(longitude, 10) || Math.ceil((boundaries.east + boundaries.west) / 2);
}

/**
 * @desc Sets up map configuration
 * @param {object} req - Express.js request
 * @param {object} mapData - Map configuration
 * @returns {object} - promise
 */
function setupMap(req, mapData) {
	var deferred = Q.defer(),
		maxZoom = utils.binToMaxZoomLevel(mapData.max_zoom),
		boundaries;

	// Setup the basic map layer
	mapData.layer = {
		minZoom: mapData.min_zoom,
		maxZoom: maxZoom
	};

	// Add attribution if set
	if (mapData.attribution) {
		mapData.layer.attribution = mapData.attribution;
	}

	// Add tiles sub domains if set up
	if (mapData.subdomains) {
		mapData.layer.subdomains = mapData.subdomains;
	}

	// Set images url and initial zoom level
	// TODO: set assetsBase!!!
	mapData.imagesPath = config.assetsBase || '/' + config.getCachebuster() + '/vendor/leaflet/images';
	mapData.zoom = getZoomLevel(req.params.zoom, mapData.min_zoom, maxZoom);

	if (mapData.type === 'custom') {
		// Setup custom map
		mapData.pathTemplate = getPathTemplate(mapData.name);
		boundaries = utils.getMapBoundaries(
			mapData.width,
			mapData.height,
			maxZoom
		);
		mapData.boundaries = boundaries;
		mapData.layer.tms = true;
		mapData.layer.noWrap = true;
	} else {
		// Setup geo map
		mapData.pathTemplate = mapData.url;
		boundaries = {
			north: 90,
			south: -90,
			east: 180,
			west: -180
		};
	}

	// Set initial coordinates
	mapData.latitude = getLatitude(req.params.latitude, boundaries);
	mapData.longitude = getLongitude(req.params.longitude, boundaries);

	deferred.resolve(mapData);
	return deferred.promise;
}

/**
 * @desc Renders template file
 * @param {object} res  Express.js response
 * @param {string} templateFile Template file name
 * @param {object} params object containing replacement params
 * @param {number} responseCode code to set in response header
 */
function renderTemplate(res, templateFile, params, responseCode) {
	fs.readFile(templateFile, function (err, data) {
		var template;
		if (err) {
			res.send(500);
		} else {
			template = data.toString();
			Object.keys(params).forEach(function (key) {
				template = template.replace(new RegExp(key, 'g'), params[key]);
			});
			res.send(responseCode, template);
		}
	});
}

/**
 * @desc Render map handler
 * @param {object} req Express.js request
 * @param {object} res Express.js response
 * @param {string} apiConfigUrl Path to template directory
 */
function middleware(req, res, apiConfigUrl) {
	var mapId = parseInt(req.params.id, 10) || 0;

	res.setCacheValidity(caching.cacheShort);

	if (mapId !== 0) {
		loadMapInfo(mapId)
			.then(checkTileSetStatus)
			.then(getPoints)
			.then(getTypes)
			.then(function (mapData) {
				return setupMap(req, mapData);
			})
			.then(function (mapData) {
				renderTemplate(
					res,
					apiConfigUrl + 'render.html', {
						'{{{mapSetup}}}': JSON.stringify(mapData),
						'{{cacheBuster}}': config.getCachebuster()
					},
					200
				);
			})
			.catch(function (error) {
				logger.error('Error rendering map', error);

				renderTemplate(
					res,
					apiConfigUrl + 'error.html', {
						'{{{errorMessage}}}': error.message,
						'{{{error}}}': JSON.stringify(error)
					},
					error.code
				);
			});
	} else {
		res.send(400);
	}
}

module.exports = function setupMapRender(app, apiEntryPointUrlV1, apiConfigUrl) {
	var passToMiddleware = function (req, res) {
		middleware(req, res, apiConfigUrl);
	};

	// attach entry points for map render
	app.get(apiEntryPointUrlV1 + 'render/:id', passToMiddleware);
	app.get(apiEntryPointUrlV1 + 'render/:id/:zoom', passToMiddleware);
	app.get(apiEntryPointUrlV1 + 'render/:id/:zoom/:lat/:lon', passToMiddleware);
};
