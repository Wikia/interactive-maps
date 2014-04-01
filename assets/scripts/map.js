(function($, L){
	'use strict';

	//TODO: Figure out base url
	var apiHost = 'http://localhost:3000',
		apiBaseDirectory = 'api',
		apiVersion = 'v1',
		mapContainerId = 'map',
		imagePath = '/images',
		map,

		// TODO: remove this once we return all required info from the API
		defaultMapConfig = {
			initLat: 0,
			initLon: 0,
			initZoom: 0,
			pathTemplate: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
			mapSetup: {},
			points: [
				{
					title: 'test name',
					description: 'test description',
					lat: 42.676845,
					lon: 23.283205
				}
			]
		};

	function createUrl(request) {
		return [
			apiHost,
			apiBaseDirectory,
			apiVersion,
			request
		].join('/');
	}

	function message(text, messageType) {
		messageType = messageType || 'error';
		$('<div></div>' )
			.addClass('message ' + messageType)
			.html(text)
			.bind('click', function(){
				$(this).remove();
			})
			.appendTo('body');
	}

	function createPoints(pointsOfInterest) {
		// TODO: Add points to the map
	}

	function addPointOnMap(point) {
		var popupHtml = '<h3>' + point.title + '</h3>' +
			'<p>' +point.description + '</p>';
		return L.marker([ point.lat, point.lon ], {
			riseOnHover: true
		})
			.bindPopup(popupHtml)
			.addTo(map);
	}

	function createMap(config) {
		config = $.extend(true, config, defaultMapConfig);
		L.Icon.Default.imagePath = imagePath;
		map = L.map(mapContainerId)
			.setView([config.initLat, config.initLon], config.initZoom);

		L.tileLayer(config.pathTemplate, config.mapSetup).addTo(map);

		config.points.forEach(function (point){
			addPointOnMap(point);
		});

	}

	function init(){
		$.get(createUrl('map/1'), function(data) {
			createMap(data);
		}, 'json')
			.fail(function(jqXHR, textStatus, errorThrown){
				message(errorThrown);
			});
	}

	init();
})(window.jQuery, window.L);
