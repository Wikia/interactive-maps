(function(window, L){
	'use strict';

	//TODO: Change the default images url when it's final
	var imagePath = '/images',
		mapContainerId = 'map',
		map;

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
			.setView([config.latitude, config.longitude], config.zoom);

		L.tileLayer(config.pathTemplate, config.mapSetup).addTo(map);

		config.points.forEach(function (point){
			addPointOnMap(point);
		});

	}

	function init(mapSetup){
		createMap(mapSetup);
	}

	init(window.mapSetup);

})(window, window.L);
