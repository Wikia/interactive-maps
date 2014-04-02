(function(window, L){
	'use strict';

	//TODO: Figure out base url
	var apiHost = 'http://localhost:3000',
		apiBaseDirectory = 'api',
		apiVersion = 'v1',
		mapContainerId = 'map',
		imagePath = '/images',
		map;

	function createUrl(request) {
		return [
			apiHost,
			apiBaseDirectory,
			apiVersion,
			request
		].join('/');
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
		L.Icon.Default.imagePath = imagePath;
		map = L.map(mapContainerId)
			.setView([config.initLat, config.initLon], config.initZoom);

		L.tileLayer(config.pathTemplate, config.mapSetup).addTo(map);

		config.points.forEach(function (point){
			addPointOnMap(point);
		});

	}

	function init(mapConfig){
		createMap(mapConfig);
	}

	init(window.mapConfig);

})(window, window.L);
