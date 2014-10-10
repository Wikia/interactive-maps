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
	defaultZoomForRealMap = config.defaultZoomForRealMap || 2,
	language;

/**
 * @desc Load Map instance
 *
 * @param {object} conn Database connection
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadMapInfo(conn, mapId) {
	return dbCon.knex('map')
		.join('tile_set', 'tile_set.id', '=', 'map.tile_set_id')
		.column([
			'map.id',
			'map.title',
			'map.city_title',
			'map.city_url',
			'map.city_id',
			'map.locked',
			'map.updated_on',
			'map.tile_set_id',
			'tile_set.name',
			'tile_set.type',
			'tile_set.url',
			'tile_set.width',
			'tile_set.height',
			'tile_set.min_zoom',
			'tile_set.max_zoom',
			'tile_set.background_color',
			'tile_set.status',
			'tile_set.attribution',
			'tile_set.subdomains'
		])
		.where('map.id', '=', mapId)
		.andWhere(function () {
			this.whereIn('tile_set.status', [
				utils.tileSetStatus.ok,
				utils.tileSetStatus.processing,
				utils.tileSetStatus.private
			]);
		})
		.connection(conn)
		.select();
}

/**
 * @desc Load Points for map instance
 * @param {object} conn Database connection
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadPoints(conn, mapId) {
	return dbCon.select(
		conn,
		'poi', [
			'id',
			'name',
			'poi_category_id',
			'description',
			'link',
			'link_title',
			'photo',
			'lat',
			'lon'
		], {
			map_id: mapId
		}
	).then(
		function (collection) {
			collection.forEach(function (item) {
				item.name = utils.escapeHtml(item.name);

				if (item.description) {
					item.description = utils.escapeHtml(item.description);
				}
			});
			return collection;
		}
	);
}

/**
 * @desc Load point types
 *
 * @param {object} conn Database connection
 * @param {number} mapId
 * @returns {object} - promise
 */
function loadTypes(conn, mapId) {
	return dbCon.select(
		conn,
		'poi_category', [
			'id',
			'parent_poi_category_id',
			'map_id',
			'name',
			'marker',
			'status'
		], {
			'map_id': mapId
		}
	).then(
		function (collection) {
			utils.handleDefaultMarker(collection);
			utils.convertMarkersNamesToUrls(collection, config.dfsHost, config.bucketPrefix, config.markersPrefix);
			collection.forEach(function (item) {
				item.name = utils.escapeHtml(item.name);
			});
			return collection;
		}
	);
}

/**
 * @desc Checks tile set status and rejects promise if needed
 * @param {object} mapData Map data
 * @returns {object} - promise
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
 * @param {object} mapData
 */
function handleDefaultCategory(mapData) {
	var points = mapData.points,
		types = mapData.types,
		numberOfPoints = points.length,
		i;

	mapData.catchAllCategoryId = config.catchAllCategoryId;
	for (i = 0; i < numberOfPoints; i++) {
		if (points[i].poi_category_id === mapData.catchAllCategoryId) {
			//Adds the default POI category to show it in Filter Box
			types.push({
				id: config.catchAllCategoryId,
				marker: null,
				name: i18n.msg('wikia-interactive-maps-default-poi-category', language)
			});
			break;
		}
	}
}

/**
 * @desc Get points
 * @param {object} conn Database connection
 * @param {object} mapData
 * @returns {object} - promise
 */
function getPoints(conn, mapData) {
	var deferred = Q.defer();

	loadPoints(conn, mapData.id)
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
 * @param {object} conn Database connection
 * @param {object} mapData
 * @returns {object} - promise
 */
function getTypes(conn, mapData) {
	var deferred = Q.defer();

	loadTypes(conn, mapData.id).then(
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
 * @param {number} tileSetId
 * @returns {string}
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
 * @param {number} defaultLatitude
 * @returns {number} Latitude
 */
function getLatitude(latitude, defaultLatitude) {
	return parseFloat(latitude) || defaultLatitude;
}

/**
 * @desc Returns map's set or default longitude
 * @param {number} longitude
 * @param {number} defaultLongitude
 * @returns {number} Longitude
 */
function getLongitude(longitude, defaultLongitude) {
	return parseFloat(longitude) || defaultLongitude;
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
	mapData.imagesPath = config.getAssetsUrlPart() + '/vendor/leaflet/images';
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
 * @param {string} cityUrl
 * @param {number} mapId
 * @returns {string}
 */
function createEditMapUrl(cityUrl, mapId) {
	return cityUrl + 'wiki/Special:Maps/' + mapId;
}

/**
 * @desc Creates the varying attribute section;
 * @param {object} mapData
 * @todo fix attribution markup
 * @returns {string}
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
 * @desc Sets language
 * @param {string} uselang
 */
function setLanguage(uselang) {
	language = i18n.getLanguage(uselang);
}

/**
 * @desc Render error template
 *
 * @param {string} apiConfigUrl Path to template directory
 * @param {object} res Express Response object
 * @param {object} error Error object
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
 * @param {object} req Express.js request
 * @param {object} res Express.js response
 * @param {string} apiPathEntryPoint Path to template directory
 * @param {string} apiConfigUrl Path to template directory
 */
function middleware(req, res, apiPathEntryPoint, apiConfigUrl) {
	var mapId = parseInt(req.params.id, 10) || 0;

	res.setCacheValidity(caching.cacheShort);
	res.setSurrogateKey(utils.surrogateKeyPrefix + mapId);

	if (mapId !== 0) {
		dbCon.getConnection(dbCon.connType.all, function (conn) {
			loadMapInfo(conn, mapId)
				.then(function (mapData) {
					setLanguage(req.query.uselang);
					return checkTileSetStatus(mapData);
				})
				.then(function (mapData) {
					return getPoints(conn, mapData);
				})
				.then(function (mapData) {
					return getTypes(conn, mapData);
				})
				.then(function (mapData) {
					return setupMap(req, mapData);
				})
				.then(function (mapData) {
					var updatedOn = new Date(mapData.updated_on);
					mapData.i18n = i18n.getTranslations(language);
					mapData.iframeSrc = utils.responseUrl(req, apiPathEntryPoint + 'render/', mapId);
					mapData.hideAttr = typeof(req.query.hideAttr) !== 'undefined';
					mapData.cacheBuster = config.getCachebusterUrlPart();

					res.header({
						'E-Tag': caching.getEtag(updatedOn.getTime())
					});

					renderTemplate(
						res,
						apiConfigUrl + 'render.html', {
							'{{{mapSetup}}}': JSON.stringify(mapData),
							'{{cacheBuster}}': mapData.cacheBuster,
							'{{{attribution}}}': createAttributionText(mapData),
							'{{bgColor}}': mapData.background_color,
							'{{canonicalUrl}}': createEditMapUrl(mapData.city_url, mapData.id)
						},
						200
					);
				})
				.catch (function (error) {
				logger.error('Error rendering map', error);

				renderError(apiConfigUrl, res, error);
			});
		}, function (error) {
			renderError(apiConfigUrl, res, error);
		});
	} else {
		res.send(400);
	}
}

module.exports = function setupMapRender(app, apiEntryPointUrlV1, apiConfigUrl) {
	var passToMiddleware = function (req, res) {
		middleware(req, res, apiEntryPointUrlV1, apiConfigUrl);
	};

	// attach entry points for map render
	app.get(apiEntryPointUrlV1 + 'render/:id', passToMiddleware);
	app.get(apiEntryPointUrlV1 + 'render/:id/:zoom', passToMiddleware);
	app.get(apiEntryPointUrlV1 + 'render/:id/:zoom/:lat/:lon', passToMiddleware);
};
