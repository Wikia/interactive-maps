'use strict';

var config = require('./config'),
	utils = require('./utils'),
	Q = require('q'),
	fs = require('fs'),
	dbConnector = require('./db_connector');

/**
 * @desc Load Map instance
 * @param mapId {number}
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
			'tile_set.min_zoom',
			'tile_set.max_zoom'
		])
		.where({
			'map.id': mapId,
			'tile_set.status': utils.tileSetStatus.ok
		})
		.select();
}

/**
 * @desc Load Points for map instance
 * @param mapId {number}
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
 * @param mapId {number}
 * @returns {object} - promise
 */
function loadTypes(mapId) {
	return dbConnector.knex('poi')
		.distinct()
		.column([
			'poi_category.id',
			'poi_category.parent_poi_category_id',
			'poi_category.name',
			'poi_category.marker'
		])
		.join('poi_category', 'poi.poi_category_id', '=', 'poi_category.id')
		.where({
			'poi.map_id': mapId
		})
		.select();
}
/**
 * @desc Load point types
 * @param mapData {object}
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
 * @param mapData {object}
 * @returns {object} - promise
 */
function getTypes(mapData) {
	var deferred = Q.defer();

	if (mapData.points.length > 0) {
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
	} else {
		mapData.types = [];
		deferred.resolve(mapData);
	}

	return deferred.promise;
}

/**
 * Generate path template for map
 * @param mapName {string}
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
 * @param zoom {number} - user passed zoom level
 * @param minZoom {number} - minimum zoom level
 * @param maxZoom {number} - maximum zoom level
 * @returns {number} - zoom level
 */
function getZoomLevel(zoom, minZoom, maxZoom) {
	// TODO: Figure out default zoom level
	zoom = parseInt(zoom, 10) || 0;
	return Math.max(Math.min(zoom, maxZoom), minZoom);
}

/**
 * @desc Returns map's set or default latitude
 * @param latitude {number}
 * @returns {number}
 */
function getLatitude(latitude) {
	// TODO: Figure out default latitude
	return parseFloat(latitude) || 0;
}

/**
 * @desc Returns map's set or default longitude
 * @param longitude {number}
 * @returns {number}
 */

function getLongitude(longitude) {
	// TODO: Figure out default longitude
	return parseFloat(longitude) || 0;
}

/**
 * @desc Renders template file
 * @param res {object} Express.js response
 * @param templateFile {string} Template file name
 * @param params {object} object containing replacement params
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
 * @param req {object} Express.js request
 * @param res {object} Express.js response
 * @param apiConfigUrl {string} Path to template directory
 */
function middleware(req, res, apiConfigUrl) {
	var mapId = parseInt(req.params.id, 10) || 0;
	if (mapId !== 0) {
		loadMapInfo(mapId)
			.then(getPoints)
			.then(getTypes)
			.then(
				function (mapSetup) {
					mapSetup.latitude = getLatitude(req.params.longitude);
					mapSetup.longitude = getLongitude(req.params.longitude);
					mapSetup.zoom = getZoomLevel(req.params.zoom, mapSetup.min_zoom,
						utils.binToMaxZoomLevel(mapSetup.max_zoom));
					mapSetup.pathTemplate = getPathTemplate(mapSetup.name);
					mapSetup.imagesPath = config.assetsBase || '/images';
					mapSetup.map = {
						tms: true,
						minZoom: mapSetup.min_zoom,
						maxZoom: utils.binToMaxZoomLevel(mapSetup.max_zoom),
						noWrap: true
					};

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
