'use strict';

var config = require('./config'),
	utils = require('./utils'),
	url = require('url'),
	Q = require('q'),
	fs = require('fs'),
	logger = require('./logger'),
	dbCon = require('./db_connector'),
	caching = require('./cachingUtils'),
	i18n = require('./i18n'),
	mapDataUtils = require('./../api/v1/map_data.utils'),
	crudUtils = require('./../api/v1/crud.utils'),
	renderConfig = require('./renderMap.config'),
	renderUtils = require('./renderMap.utils'),
	defaultZoomForRealMap = config.defaultZoomForRealMap || 2,
	language;

/**
 * @desc Fetches data for a map from DB
 * @param {Object} req Express request
 * @param {Object} conn Database connection
 * @param {Number} mapId
 * @returns {Object} Promise
 */
function loadRenderData(req, conn, mapId) {
	return renderUtils.getMapInfo(conn, mapId)
		.then(function (mapData) {
			setLanguage(req.query.uselang);
			return checkTileSetStatus(mapData);
		})
		.then(function (mapData) {
			return mapDataUtils
				.getPois(conn, mapData, renderConfig.poiColumns);
		})
		.then(function (mapData) {
			return mapDataUtils
				.getPoiCategories(conn, mapData, renderConfig.poiCategoryColumns);
		});
}

/**
 * @desc Checks tile set status and rejects promise if needed
 * @param {Object} mapData Map data from DB
 * @returns {Object} - promise
 */
function checkTileSetStatus(mapData) {
	var deferred = Q.defer();

	if (mapData.length === 1) {
		mapData = mapData[0];
		if (mapData.status === utils.tileSetStatus.processing) {
			deferred.reject({
				code: 202,
				message: i18n.msg('wikia-interactive-maps-error-map-processed', language),
				originalImageUrl: mapData.url
			});
		} else {
			deferred.resolve(mapData);
		}
	} else {
		deferred.reject({
			code: 404,
			message: i18n.msg('wikia-interactive-maps-error-map-not-found', language)
		});
	}
	return deferred.promise;
}

/**
 * @desc If there are pins from a generic category, it attaches the category to types
 * @param {Object} mapData
 */
function handleDefaultCategory(mapData) {
	var pois = mapData.pois,
		poiCategories = mapData.poi_categories,
		numberOfPois = pois.length,
		i;

	mapData.catchAllCategoryId = config.catchAllCategoryId;
	for (i = 0; i < numberOfPois; i++) {
		if (pois[i].poi_category_id === mapData.catchAllCategoryId) {
			//Adds the default POI category to show it in Filter Box
			poiCategories.push({
				id: config.catchAllCategoryId,
				marker: null,
				name: i18n.msg('wikia-interactive-maps-default-poi-category', language)
			});
			break;
		}
	}
}

/**
 * @desc Generate path template for map
 * @param {Number} tileSetId
 * @returns {String}
 */
function getPathTemplate(tileSetId) {
	return utils.imageUrl(
		config.dfsHost,
		utils.getBucketName(
			config.bucketPrefix + config.tileSetPrefix,
			tileSetId
		),
		'{z}/{x}/{y}.png'
	);
}

/**
 * @desc Returns map's zoom level based on provided, max and min zoom levels
 * @param {Number} zoom - user passed zoom level
 * @param {Number} minZoom - minimum zoom level
 * @param {Number} maxZoom - maximum zoom level
 * @returns {Number} - zoom level
 */
function getZoomLevel(zoom, minZoom, maxZoom) {
	zoom = parseInt(zoom, 10) || Math.ceil((maxZoom - minZoom) / 2);
	return Math.max(Math.min(zoom, maxZoom), minZoom);
}

/**
 * @desc Returns map's set or default latitude
 * @param {Number} latitude
 * @param {Number} defaultLatitude
 * @returns {Number} Latitude
 */
function getLatitude(latitude, defaultLatitude) {
	return parseFloat(latitude) || defaultLatitude;
}

/**
 * @desc Returns map's set or default longitude
 * @param {Number} longitude
 * @param {Number} defaultLongitude
 * @returns {Number} Longitude
 */
function getLongitude(longitude, defaultLongitude) {
	return parseFloat(longitude) || defaultLongitude;
}

/**
 * @desc Sets up map configuration
 * @param {Object} req - Express.js request
 * @param {Object} mapData - Map configuration
 * @returns {Object} - promise
 */
function setupMap(req, mapData) {
	var deferred = Q.defer(),
		maxZoom = utils.binToMaxZoomLevel(mapData.max_zoom),
		zoomLevelWidth = mapData.width,
		zoomLevelHeight = mapData.height,
		targetZoomLevel = utils.getMaxZoomLevel(zoomLevelWidth, zoomLevelHeight, config.maxZoom),
		boundaries,
		mapCenterBoundaries,
		ratio;

	handleDefaultCategory(mapData);

	// Escape map title
	mapData.title = utils.escapeHtml(mapData.title);
	mapData.name = utils.escapeHtml(mapData.name);

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
	mapData.imagesPath = config.getAssetsUrlPart() + renderConfig.leafletImagesPath;
	mapData.zoom = getZoomLevel(req.params.zoom, mapData.min_zoom, maxZoom);
	mapData.gaUser = config.gaUser;

	if (mapData.type === 'custom') {
		// Setup custom map
		mapData.pathTemplate = getPathTemplate(mapData.tile_set_id);

		if (maxZoom < targetZoomLevel) {
			ratio = Math.pow(2, targetZoomLevel - maxZoom);
			zoomLevelWidth = Math.ceil(zoomLevelWidth / ratio);
			zoomLevelHeight = Math.ceil(zoomLevelHeight / ratio);
		}

		boundaries = utils.getMapBoundaries(
			zoomLevelWidth,
			zoomLevelHeight,
			maxZoom
		);
		mapData.boundaries = boundaries;
		mapData.layer.tms = true;
		mapData.layer.noWrap = true;

		// Get the boundaries for the center of the map
		mapCenterBoundaries = utils.getMapBoundaries(
			Math.ceil(zoomLevelWidth / 2),
			Math.ceil(zoomLevelHeight / 2),
			maxZoom
		);

		mapData.zoom = getZoomLevel(req.params.zoom, mapData.min_zoom, maxZoom);
	} else {
		// Setup geo map
		mapData.pathTemplate = mapData.url;
		mapCenterBoundaries = {
			east: 0,
			north: 0
		};
		mapData.zoom = getZoomLevel(req.params.zoom, defaultZoomForRealMap, defaultZoomForRealMap);
	}

	// Set initial coordinates
	mapData.latitude = getLatitude(req.params.latitude, mapCenterBoundaries.north);
	mapData.longitude = getLongitude(req.params.longitude, mapCenterBoundaries.east);
	mapData.defaultZoomForRealMap = defaultZoomForRealMap;

	deferred.resolve(mapData);
	return deferred.promise;
}

/**
 * @desc Create map edit URL
 * @param {String} cityUrl
 * @param {Number} mapId
 * @returns {String}
 */
function createEditMapUrl(cityUrl, mapId) {
	return cityUrl + 'wiki/Special:Maps/' + mapId;
}

/**
 * @desc Creates the varying attribute section;
 * @param {Object} mapData
 * @todo fix attribution markup
 * @returns {String}
 */
function createAttributionText(mapData) {
	var communityUrl = url.parse(mapData.city_url);
	return '<a class="sprite edit" href="' + createEditMapUrl(mapData.city_url, mapData.id) + '" target="_blank">' +
		i18n.msg('wikia-interactive-maps-edit-map', language) + '</a>' +
		'<a class="sprite logo" href="http://maps.wikia.com/" target="_blank">Wikia Maps</a>' +
		'<a class="comm" href="' + mapData.city_url + '" target="_blank">' + communityUrl.hostname + '</a>';
}

/**
 * @desc Renders template file
 * @param {Object} res  Express.js response
 * @param {String} templateFile Template file name
 * @param {Object} params object containing replacement params
 * @param {Number} responseCode code to set in response header
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
			utils.sendHttpResponse(res, responseCode, template);
		}
	});
}

/**
 * @desc Sets language
 * @param {String} uselang
 */
function setLanguage(uselang) {
	language = i18n.getLanguage(uselang);
}

/**
 * @desc Render error template
 *
 * @param {String} apiConfigUrl Path to template directory
 * @param {Object} res Express Response object
 * @param {Object} error Error object
 */
function renderError(apiConfigUrl, res, error) {
	renderTemplate(
		res,
		apiConfigUrl + 'error.html', {
			'{{{errorMessage}}}': error.message,
			'{{{error}}}': JSON.stringify(error)
		},
		error.code || 500 // it can be undefined
	);
}

/**
 * @desc Render map handler
 * @param {Object} req Express.js request
 * @param {Object} res Express.js response
 * @param {Function} next Express.js response
 * @param {String} apiPathEntryPoint Path to template directory
 * @param {String} apiConfigUrl Path to template directory
 */
function renderMap(req, res, next, apiPathEntryPoint, apiConfigUrl) {
	var mapId = parseInt(req.params.id, 10) || 0;

	res.setCacheValidity(caching.cacheShort);
	res.setSurrogateKey(utils.surrogateKeyPrefix + mapId);

	if (mapId !== 0) {
		dbCon.getConnection(dbCon.connType.all)
			.then(function (conn) {
				loadRenderData(req, conn, mapId)
					.then(function (mapData) {
						conn.release();
						return setupMap(req, mapData);
					})
					.then(function (mapData) {
						var updatedOn = new Date(mapData.updated_on);
						mapData.i18n = i18n.getTranslations(language);
						mapData.iframeSrc = utils.responseUrl(req, apiPathEntryPoint + 'render/', mapId);
						mapData.hideAttr = typeof(req.query.hideAttr) !== 'undefined';
						mapData.cacheBuster = config.getCachebusterUrlPart();
						renderUtils.setupMarkers(mapData.poi_categories);

						res.header({
							'E-Tag': caching.getEtag(updatedOn.getTime())
						});

						renderTemplate(
							res,
							apiConfigUrl + 'render.html', {
								'{{{mapSetup}}}': JSON.stringify(mapData),
								'{{cacheBuster}}': mapData.cacheBuster,
								'{{{attribution}}}': createAttributionText(mapData),
								'{{bgColor}}': mapData.background_color
							},
							200
						);
					})
					.catch (function (error) {
						logger.error('Error rendering map', error);
						crudUtils.releaseConnectionOnFail(conn, next);
						renderError(apiConfigUrl, res, error);
					});
			}).catch(function () {
				logger.error('Error rendering map', error);
				crudUtils.releaseConnectionOnFail(conn, next);
				renderError(apiConfigUrl, res, error);
			});

	} else {
		res.send(400);
	}
}

/**
 * @desc Sets up handlers to api entry points
 * @param {Object} app - Express application object
 * @param {String} apiEntryPointUrlV1
 * @param {Function} render
 */
function attachEntryPoints(app, apiEntryPointUrlV1, render) {
	app.get(apiEntryPointUrlV1 + 'render/:id', render);
	app.get(apiEntryPointUrlV1 + 'render/:id/:zoom', render);
	app.get(apiEntryPointUrlV1 + 'render/:id/:zoom/:lat/:lon', render);
}

module.exports = function setupMapRender(app, apiEntryPointUrlV1, apiConfigUrl) {
	var render = function (req, res, next) {
		renderMap(req, res, next, apiEntryPointUrlV1, apiConfigUrl);
	};
	attachEntryPoints(app, apiEntryPointUrlV1, render);
};
