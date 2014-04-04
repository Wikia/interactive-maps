'use strict';

var config = require('./config' ),
	utils = require('./utils' ),
	Q = require('q'),
	dbConnector = require('./db_connector');

/**
 * @desc Load Map instance
 * @param mapInstanceId {integer}
 * @returns {promise}
 */
function loadMapInfo( mapInstanceId ) {
	return dbConnector.knex('map_instance')
		.join('map', 'map.id', '=', 'map_instance.map_id')
		.column([
			'map_instance.id',
			'map_instance.title',
			'map_instance.locked',
			'map.name',
			'map.type',
			'map.min_zoom',
			'map.max_zoom'
		])
		.where('map_instance.id', mapInstanceId)
		.select();
}

/**
 * @desc Load Points for map instance
 * @param mapInstanceId {integer}
 * @returns {promise}
 */
function loadPoints(mapInstanceId) {
	return dbConnector.select(
		'poi',
		[
			'name',
			'poi_category_id',
			'description',
			'link',
			'photo',
			'lat',
			'lon'
		],
		{
			map_instance_id: mapInstanceId
		}
	);
}

/**
 * @desc Load point types
 * @param points {array}
 * @returns {promise}
 */
function loadTypes(mapInstanceId) {
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
			'poi.map_instance_id': mapInstanceId
		})
		.select();
}

function getPoints(mapData) {
	var deferred = Q.defer();

	if ( mapData.length === 1 ) {
		mapData = mapData[0];
		loadPoints(mapData.id)
			.then(
				function(points) {
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

function getTypes(mapData) {
	var deferred = Q.defer();

	if ( mapData.points.length > 0 ) {
		loadTypes(mapData.id ).then(
			function(points) {
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
	var bucketName = utils.getBucketName(config.bucketPrefix, mapName);
	return 'http://images.wikia.com/' + bucketName + '/{z}/{x}/{y}.png';
}

function getZoomLevel(zoom, minZoom, maxZoom) {
	// TODO: Figure out default zoom level
	zoom = parseInt(zoom, 10) || 0;
	return Math.max(Math.min(zoom, maxZoom), minZoom);
}

function getLatitude(latitude) {
	// TODO: Figure out default latitude
	return parseFloat(latitude, 10) || 0;
}

function getLongitude(longitude) {
	// TODO: Figure out default longitude
	return parseFloat(longitude, 10) || 0;
}

module.exports = {
	middleware: function(req, res) {
		var mapInstanceId = parseInt(req.params.id, 10) || 0;
		if ( mapInstanceId !== 0 ) {
			loadMapInfo(mapInstanceId)
				.then(getPoints)
				.then(getTypes)
				.then(
					function(mapSetup){
						mapSetup.latitude = getLatitude(req.params.latitude);
						mapSetup.longitude = getLongitude(req.params.longitude);
						mapSetup.zoom = getZoomLevel(req.params.zoom, mapSetup.min_zoom, mapSetup.max_zoom);
						mapSetup.pathTemplate = getPathTemplate(mapSetup.name);
						mapSetup.imagePath = config.assetsBase || '';

						res.render('render.html', {
							mapSetup: JSON.stringify(mapSetup)
						});
					}
				)
				.catch(function(err){
					res.send(404, 'Interactive map not found. An unicorn is weeping');
				});
		} else {
			res.send(400);
		}
	}
};
