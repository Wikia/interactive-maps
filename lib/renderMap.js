'use strict';

var config = require('./config' ),
	utils = require('./utils' ),
	Q = require('q'),
	dbConnector = require('./db_connector');


function loadMapInstance( mapInstanceId ) {
	return dbConnector.select(
		'map_instance',
		[
			'id',
			'map_id',
			'title',
			'locked'
		],
		{
			id: mapInstanceId
		}
	);
}


function loadMap(mapId) {
	return dbConnector.select(
		'map',
		[
			'name',
			'type',
			'min_zoom',
			'max_zoom'
		],
		{
			id: mapId
		}
	);
}

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

function loadTypes(points) {
	var typeIds = [];
	points.forEach(function(point) {
		typeIds.push(parseInt(point.poi_category_id, 10));
	});

	return dbConnector.knex('poi_category')
		.column([
			'id',
			'name',
			'marker'
		])
		.whereIn('id', typeIds)
		.select();
}

function loadMapSetup( mapInstanceId ) {
	var deferred = Q.defer(),
		handleError = function(error) {
			deferred.reject(error);
		};

	loadMapInstance(mapInstanceId).then(
		function (result) {
			if ( (result.length) === 0 ){
				deferred.reject('Map not found');
			} else {
				result = result[0];
				loadMap(result.map_id ).then(
					function(map) {
						map = map[0];
						utils.extendObject(result, map);
						loadPoints(mapInstanceId).then(
							function(points) {
								result.points = points;
								if ( points.length > 0 ) {
									loadTypes(points).then(
										function(types) {
											result.types = types;
											deferred.resolve(result);
										},
										handleError
									);
								} else {
									result.types = [];
									deferred.resolve(result);
								}
							},
							handleError
						);
					},
					handleError
				);
			}
		},
		handleError
	);

	return deferred.promise;
}

function render(res, mapSetup) {

}

function getPathTemplate(mapSetup) {
	var bucketName = utils.getBucketName(config.bucketPrefix, mapSetup.name);
	return 'http://images.wikia.com/' + bucketName + '/{z}/{x}/{y}.png';
}

module.exports = {
	middleware: function(req, res) {
		var mapInstanceId = req.params.id,
			latitude = req.params.lat,
			longitude = req.params.lon,
			zoom = req.params.zoom;

		loadMapSetup(mapInstanceId ).done(function(mapSetup){
			mapSetup.latitude = latitude;
			mapSetup.longitude = longitude;
			mapSetup.zoom = Math.max(Math.min(zoom, mapSetup.max_zoom), mapSetup.min_zoom);
			mapSetup.pathTemplate = getPathTemplate(mapSetup);

			res.render('render.html', {
				mapSetup: JSON.stringify(mapSetup)
			});
		});
	}
};
