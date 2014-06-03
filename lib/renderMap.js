'use strict';

var config = require('./config'),
	utils = require('./utils'),
	Q = require('q'),
	fs = require('fs'),
	logger = require('./logger'),
	dbConnector = require('./db_connector');

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
			'tile_set.min_zoom',
			'tile_set.max_zoom',
			'tile_set.width',
			'tile_set.height',
			'tile_set.attribution',
			'tile_set.subdomains',
		])
		.where({
			'map.id': mapId,
			'tile_set.status': utils.tileSetStatus.ok
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
			'name',
			'marker'
		], {
			'map_id': mapId
		}
	);
}

/**
 * @desc Get points
 * @param {object} mapData
 * @returns {object} - promise
 */
function getPoints(mapData) {
	var deferred = Q.defer();

	if (mapData.length === 1) {
		mapData = mapData[0];
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
	} else {
		deferred.reject({
			code: 404,
			message: 'Map not found'
		});
	}
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
<<<<<<< HEAD
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
=======
>>>>>>> master
 * @desc Renders template file
 * @param {object} res  Express.js response
 * @param {string} templateFile Template file name
 * @param {object} params object containing replacement params
 */
function renderTemplate(res, templateFile, params) {
	fs.readFile(templateFile, function (err, data) {
		var template;
		if (err) {
			res.send(500);
		} else {
			template = data.toString();
			Object.keys(params).forEach(function (key) {
				template = template.replace(key, params[key]);
			});
			res.send(template);
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
	if (mapId !== 0) {
		loadMapInfo(mapId)
			.then(getPoints)
			.then(getTypes)
			.then(
				function (mapSetup) {
					var maxZoom = utils.binToMaxZoomLevel(mapSetup.max_zoom),
						boundaries;

					// Setup the basic map layer
					mapSetup.layer = {
						minZoom: mapSetup.min_zoom,
						maxZoom: maxZoom
					};

					// Add attribution if set
					if (mapSetup.attribution) {
						mapSetup.layer.attribution = mapSetup.attribution;
					}

					// Add tiles sub domains if set up
					if (mapSetup.subdomains) {
						mapSetup.layer.subdomains = mapSetup.subdomains;
					}

					// Set images url and initial zoom level
					mapSetup.imagesPath = config.assetsBase || '/images';
					mapSetup.zoom = getZoomLevel(req.params.zoom, mapSetup.min_zoom, maxZoom);

					if (mapSetup.type === 'custom') {
						// Setup custom map
						mapSetup.pathTemplate = getPathTemplate(mapSetup.name);
						boundaries = utils.getMapBoundaries(
							mapSetup.width,
							mapSetup.height,
							maxZoom
						);
						mapSetup.boundaries = boundaries;
						mapSetup.layer.tms = true;
						mapSetup.layer.noWrap = true;
					} else {
						// Setup geo map
						mapSetup.pathTemplate = mapSetup.url;
						boundaries = {
							north: 90,
							south: -90,
							east: 180,
							west: -180
						};
					}

					// Set initial coordinates
					mapSetup.latitude = getLatitude(req.params.longitude, boundaries);
					mapSetup.longitude = getLongitude(req.params.longitude, boundaries);

					renderTemplate(
						res,
						apiConfigUrl + 'render.html', {
							'{{{mapSetup}}}': JSON.stringify(mapSetup)
						}
					);
				}
		)
		.catch (function (err) {
			res.send(404, 'Interactive map not found. An unicorn is weeping');
			logger.error('Error rendering map', err);
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
